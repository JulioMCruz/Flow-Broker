// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {PaymentAccumulator} from "../src/PaymentAccumulator.sol";

contract PaymentAccumulatorTest is Test {
    PaymentAccumulator public accumulator;

    address public owner = address(this);
    address public recorder = makeAddr("recorder");
    address public agent1 = makeAddr("agent1");
    address public agent2 = makeAddr("agent2");
    address public agent3 = makeAddr("agent3");

    uint256 public constant THRESHOLD = 5; // low for testing
    uint256 public constant GAS_PER_TX = 50000; // estimated gas per individual tx

    event PaymentRecorded(address indexed from, address indexed to, uint256 amount, uint256 timestamp);
    event PaymentThresholdReached(uint256 indexed batchId, uint256 count, uint256 totalAmount);
    event BatchSettled(uint256 indexed batchId, uint256 paymentCount, uint256 totalAmount, bytes32 txHash, uint256 gasSaved);

    function setUp() public {
        accumulator = new PaymentAccumulator(THRESHOLD, GAS_PER_TX);
        accumulator.setRecorder(recorder, true);
    }

    // ================================================================
    // │ Record Payment Tests                                          │
    // ================================================================

    function test_recordPayment() public {
        vm.prank(recorder);
        accumulator.recordPayment(agent1, agent2, 1000);

        (uint256 batchId, uint256 count, uint256 amount,) = accumulator.getCurrentBatchStats();
        assertEq(batchId, 0);
        assertEq(count, 1);
        assertEq(amount, 1000);
        assertEq(accumulator.totalLifetimePayments(), 1);
        assertEq(accumulator.totalLifetimeVolume(), 1000);
    }

    function test_recordPayment_emitsEvent() public {
        vm.prank(recorder);
        vm.expectEmit(true, true, false, true);
        emit PaymentRecorded(agent1, agent2, 1000, block.timestamp);
        accumulator.recordPayment(agent1, agent2, 1000);
    }

    function test_recordPayment_revertUnauthorized() public {
        vm.prank(agent1);
        vm.expectRevert(PaymentAccumulator.NotAuthorized.selector);
        accumulator.recordPayment(agent1, agent2, 1000);
    }

    function test_recordPayment_revertZeroAmount() public {
        vm.prank(recorder);
        vm.expectRevert(PaymentAccumulator.InvalidAmount.selector);
        accumulator.recordPayment(agent1, agent2, 0);
    }

    // ================================================================
    // │ Threshold Tests                                               │
    // ================================================================

    function test_thresholdReached_emitsEvent() public {
        vm.startPrank(recorder);

        // Record 4 payments (below threshold)
        for (uint256 i = 0; i < 4; i++) {
            accumulator.recordPayment(agent1, agent2, 1000);
        }
        (,uint256 count,,) = accumulator.getCurrentBatchStats();
        assertEq(count, 4);

        // 5th payment should trigger threshold event
        vm.expectEmit(true, false, false, true);
        emit PaymentThresholdReached(0, 5, 5000);
        accumulator.recordPayment(agent1, agent2, 1000);

        vm.stopPrank();
    }

    // ================================================================
    // │ Batch Recording Tests                                         │
    // ================================================================

    function test_recordBatchPayments() public {
        address[] memory froms = new address[](3);
        address[] memory tos = new address[](3);
        uint256[] memory amounts = new uint256[](3);

        froms[0] = agent1; tos[0] = agent2; amounts[0] = 1000;
        froms[1] = agent1; tos[1] = agent3; amounts[1] = 500;
        froms[2] = agent2; tos[2] = agent3; amounts[2] = 2000;

        vm.prank(recorder);
        accumulator.recordBatchPayments(froms, tos, amounts);

        (,uint256 count, uint256 amount,) = accumulator.getCurrentBatchStats();
        assertEq(count, 3);
        assertEq(amount, 3500);
        assertEq(accumulator.totalLifetimePayments(), 3);
    }

    // ================================================================
    // │ Settlement Tests                                              │
    // ================================================================

    function test_recordBatchSettlement() public {
        vm.startPrank(recorder);

        // Record some payments
        for (uint256 i = 0; i < 3; i++) {
            accumulator.recordPayment(agent1, agent2, 1000);
        }

        // Settle the batch
        bytes32 txHash = keccak256("0x1234");
        vm.expectEmit(true, false, false, true);
        emit BatchSettled(0, 3, 3000, txHash, 3 * GAS_PER_TX);
        accumulator.recordBatchSettlement(txHash);

        // Batch should be reset
        (uint256 batchId, uint256 count, uint256 amount,) = accumulator.getCurrentBatchStats();
        assertEq(batchId, 1); // incremented
        assertEq(count, 0);   // reset
        assertEq(amount, 0);  // reset
        assertEq(accumulator.totalBatchesSettled(), 1);

        vm.stopPrank();
    }

    // ================================================================
    // │ Lifetime Stats Tests                                          │
    // ================================================================

    function test_lifetimeStats() public {
        vm.startPrank(recorder);

        // Batch 1: 3 payments
        for (uint256 i = 0; i < 3; i++) {
            accumulator.recordPayment(agent1, agent2, 1000);
        }
        accumulator.recordBatchSettlement(keccak256("batch1"));

        // Batch 2: 2 payments
        for (uint256 i = 0; i < 2; i++) {
            accumulator.recordPayment(agent2, agent3, 2000);
        }
        accumulator.recordBatchSettlement(keccak256("batch2"));

        (uint256 payments, uint256 volume, uint256 batches, uint256 gasSaved) = accumulator.getLifetimeStats();
        assertEq(payments, 5);
        assertEq(volume, 7000); // 3*1000 + 2*2000
        assertEq(batches, 2);
        assertEq(gasSaved, 5 * GAS_PER_TX);

        vm.stopPrank();
    }

    // ================================================================
    // │ Admin Tests                                                   │
    // ================================================================

    function test_setThreshold() public {
        accumulator.setThreshold(100);
        (,,,uint256 threshold) = accumulator.getCurrentBatchStats();
        assertEq(threshold, 100);
    }
}
