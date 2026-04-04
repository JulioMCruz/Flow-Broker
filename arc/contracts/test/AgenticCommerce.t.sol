// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {AgenticCommerce} from "../src/AgenticCommerce.sol";
import {ERC20Mock} from "./mocks/ERC20Mock.sol";

contract AgenticCommerceTest is Test {
    AgenticCommerce public commerce;
    ERC20Mock public usdc;

    address public owner = address(this);
    address public client = makeAddr("client");
    address public provider = makeAddr("provider");
    address public evaluator = makeAddr("evaluator");
    address public treasury = makeAddr("treasury");

    uint256 public constant BUDGET = 15000; // $0.015 USDC
    uint256 public constant FEE_BPS = 100;  // 1%

    event JobCreated(uint256 indexed jobId, address indexed client, address provider, address evaluator, string description);
    event JobFunded(uint256 indexed jobId, uint256 amount);
    event JobSubmitted(uint256 indexed jobId, bytes32 deliverable);
    event JobCompleted(uint256 indexed jobId, bytes32 reason);
    event JobRejected(uint256 indexed jobId, bytes32 reason, address rejector);
    event JobExpired(uint256 indexed jobId);

    function setUp() public {
        usdc = new ERC20Mock("USDC", "USDC", 6);
        commerce = new AgenticCommerce(address(usdc), FEE_BPS, treasury);

        // Fund client with USDC
        usdc.mint(client, 1_000_000); // $1 USDC
    }

    // ================================================================
    // │ Job Creation Tests                                            │
    // ================================================================

    function test_createJob() public {
        vm.prank(client);
        uint256 jobId = commerce.createJob(
            provider,
            evaluator,
            block.timestamp + 1 hours,
            "LLM inference: summarize market data",
            address(0) // no hook
        );

        assertEq(jobId, 0);
        assertEq(commerce.jobCount(), 1);

        AgenticCommerce.Job memory job = commerce.getJob(0);
        assertEq(job.client, client);
        assertEq(job.provider, provider);
        assertEq(job.evaluator, evaluator);
        assertEq(uint8(job.status), uint8(AgenticCommerce.JobStatus.Open));
    }

    function test_createJob_withoutProvider() public {
        vm.prank(client);
        uint256 jobId = commerce.createJob(
            address(0), // no provider (bidding flow)
            evaluator,
            block.timestamp + 1 hours,
            "Open job for bidding",
            address(0)
        );

        AgenticCommerce.Job memory job = commerce.getJob(jobId);
        assertEq(job.provider, address(0));
    }

    function test_createJob_revertZeroEvaluator() public {
        vm.prank(client);
        vm.expectRevert(AgenticCommerce.InvalidEvaluator.selector);
        commerce.createJob(provider, address(0), block.timestamp + 1 hours, "test", address(0));
    }

    function test_createJob_revertExpiredTimestamp() public {
        vm.prank(client);
        vm.expectRevert(AgenticCommerce.InvalidExpiry.selector);
        commerce.createJob(provider, evaluator, block.timestamp - 1, "test", address(0));
    }

    // ================================================================
    // │ Set Provider Tests (bidding flow)                             │
    // ================================================================

    function test_setProvider() public {
        vm.prank(client);
        uint256 jobId = commerce.createJob(address(0), evaluator, block.timestamp + 1 hours, "test", address(0));

        vm.prank(client);
        commerce.setProvider(jobId, provider, "");

        assertEq(commerce.getJob(jobId).provider, provider);
    }

    // ================================================================
    // │ Full Job Lifecycle Tests                                      │
    // ================================================================

    function test_fullLifecycle_completed() public {
        // 1. Create job
        vm.prank(client);
        uint256 jobId = commerce.createJob(
            provider, evaluator, block.timestamp + 1 hours,
            "LLM inference", address(0)
        );

        // 2. Set budget
        vm.prank(client);
        commerce.setBudget(jobId, BUDGET, "");

        // 3. Fund (client approves + funds)
        vm.startPrank(client);
        usdc.approve(address(commerce), BUDGET);
        commerce.fund(jobId, BUDGET, "");
        vm.stopPrank();

        assertEq(uint8(commerce.getJob(jobId).status), uint8(AgenticCommerce.JobStatus.Funded));
        assertEq(usdc.balanceOf(address(commerce)), BUDGET);

        // 4. Provider submits work
        bytes32 deliverable = keccak256("ipfs://QmResult123");
        vm.prank(provider);
        commerce.submit(jobId, deliverable, "");

        assertEq(uint8(commerce.getJob(jobId).status), uint8(AgenticCommerce.JobStatus.Submitted));

        // 5. Evaluator completes
        bytes32 reason = keccak256("quality-verified");
        vm.prank(evaluator);
        commerce.complete(jobId, reason, "");

        assertEq(uint8(commerce.getJob(jobId).status), uint8(AgenticCommerce.JobStatus.Completed));

        // 6. Verify payments
        uint256 fee = (BUDGET * FEE_BPS) / 10000; // 1% = 150
        uint256 payment = BUDGET - fee; // 14850

        assertEq(usdc.balanceOf(provider), payment);
        assertEq(usdc.balanceOf(treasury), fee);
        assertEq(usdc.balanceOf(address(commerce)), 0);
    }

    function test_fullLifecycle_rejected() public {
        // Create + budget + fund
        vm.prank(client);
        uint256 jobId = commerce.createJob(provider, evaluator, block.timestamp + 1 hours, "test", address(0));
        vm.prank(client);
        commerce.setBudget(jobId, BUDGET, "");
        vm.startPrank(client);
        usdc.approve(address(commerce), BUDGET);
        commerce.fund(jobId, BUDGET, "");
        vm.stopPrank();

        // Provider submits
        vm.prank(provider);
        commerce.submit(jobId, keccak256("bad-work"), "");

        // Evaluator rejects
        uint256 clientBalanceBefore = usdc.balanceOf(client);
        vm.prank(evaluator);
        commerce.reject(jobId, keccak256("poor-quality"), "");

        assertEq(uint8(commerce.getJob(jobId).status), uint8(AgenticCommerce.JobStatus.Rejected));
        assertEq(usdc.balanceOf(client), clientBalanceBefore + BUDGET); // full refund
    }

    function test_fullLifecycle_expired() public {
        // Create + budget + fund
        vm.prank(client);
        uint256 jobId = commerce.createJob(provider, evaluator, block.timestamp + 1 hours, "test", address(0));
        vm.prank(client);
        commerce.setBudget(jobId, BUDGET, "");
        vm.startPrank(client);
        usdc.approve(address(commerce), BUDGET);
        commerce.fund(jobId, BUDGET, "");
        vm.stopPrank();

        // Warp past expiry
        vm.warp(block.timestamp + 2 hours);

        // Anyone can trigger refund
        uint256 clientBalanceBefore = usdc.balanceOf(client);
        commerce.claimRefund(jobId);

        assertEq(uint8(commerce.getJob(jobId).status), uint8(AgenticCommerce.JobStatus.Expired));
        assertEq(usdc.balanceOf(client), clientBalanceBefore + BUDGET);
    }

    // ================================================================
    // │ Access Control Tests                                          │
    // ================================================================

    function test_fund_revertNotClient() public {
        vm.prank(client);
        uint256 jobId = commerce.createJob(provider, evaluator, block.timestamp + 1 hours, "test", address(0));
        vm.prank(client);
        commerce.setBudget(jobId, BUDGET, "");

        vm.prank(provider);
        vm.expectRevert(AgenticCommerce.NotClient.selector);
        commerce.fund(jobId, BUDGET, "");
    }

    function test_submit_revertNotProvider() public {
        uint256 jobId = _createAndFundJob();

        vm.prank(client);
        vm.expectRevert(AgenticCommerce.NotProvider.selector);
        commerce.submit(jobId, keccak256("work"), "");
    }

    function test_complete_revertNotEvaluator() public {
        uint256 jobId = _createAndFundJob();
        vm.prank(provider);
        commerce.submit(jobId, keccak256("work"), "");

        vm.prank(client);
        vm.expectRevert(AgenticCommerce.NotEvaluator.selector);
        commerce.complete(jobId, bytes32(0), "");
    }

    function test_claimRefund_revertNotExpired() public {
        uint256 jobId = _createAndFundJob();

        vm.expectRevert(AgenticCommerce.JobNotExpired.selector);
        commerce.claimRefund(jobId);
    }

    // ================================================================
    // │ Client as Evaluator Test                                      │
    // ================================================================

    function test_clientAsEvaluator() public {
        // Client is also the evaluator (simplest flow)
        vm.prank(client);
        uint256 jobId = commerce.createJob(provider, client, block.timestamp + 1 hours, "self-evaluated", address(0));
        vm.prank(client);
        commerce.setBudget(jobId, BUDGET, "");
        vm.startPrank(client);
        usdc.approve(address(commerce), BUDGET);
        commerce.fund(jobId, BUDGET, "");
        vm.stopPrank();

        vm.prank(provider);
        commerce.submit(jobId, keccak256("delivered"), "");

        // Client completes as evaluator
        vm.prank(client);
        commerce.complete(jobId, keccak256("approved"), "");

        assertEq(uint8(commerce.getJob(jobId).status), uint8(AgenticCommerce.JobStatus.Completed));
    }

    // ================================================================
    // │ Helpers                                                        │
    // ================================================================

    function _createAndFundJob() internal returns (uint256 jobId) {
        vm.prank(client);
        jobId = commerce.createJob(provider, evaluator, block.timestamp + 1 hours, "test", address(0));
        vm.prank(client);
        commerce.setBudget(jobId, BUDGET, "");
        vm.startPrank(client);
        usdc.approve(address(commerce), BUDGET);
        commerce.fund(jobId, BUDGET, "");
        vm.stopPrank();
    }
}
