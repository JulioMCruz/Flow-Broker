// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";

contract AgentRegistryTest is Test {
    AgentRegistry public registry;

    address public owner = address(this);
    address public operator = makeAddr("operator");
    address public forwarder = makeAddr("forwarder");

    // Agent wallets
    address public agentWallet1 = makeAddr("agent1");
    address public agentWallet2 = makeAddr("agent2");
    address public agentWallet3 = makeAddr("agent3");

    function setUp() public {
        registry = new AgentRegistry(forwarder);
        registry.setOperator(operator, true);
    }

    // ================================================================
    // │ Registration Tests                                            │
    // ================================================================

    function test_registerAgent() public {
        AgentRegistry.AgentParams memory params = AgentRegistry.AgentParams({
            wallet: agentWallet1,
            name: "llm",
            ensName: "llm.perkmesh.eth",
            endpoint: "https://api.perkmesh.xyz/llm",
            price: 100, // $0.0001 USDC (6 decimals)
            paymentModel: AgentRegistry.PaymentModel.Streaming,
            capabilities: "text-generation,summarization"
        });

        uint256 agentId = registry.registerAgent(params);
        assertEq(agentId, 0);
        assertEq(registry.agentCount(), 1);

        AgentRegistry.Agent memory agent = registry.getAgent(0);
        assertEq(agent.wallet, agentWallet1);
        assertEq(agent.name, "llm");
        assertEq(agent.ensName, "llm.perkmesh.eth");
        assertEq(agent.price, 100);
        assertEq(uint8(agent.status), uint8(AgentRegistry.Status.Active));
        assertEq(uint8(agent.paymentModel), uint8(AgentRegistry.PaymentModel.Streaming));
        assertEq(agent.totalJobsCompleted, 0);
        assertEq(agent.totalJobsRejected, 0);
    }

    function test_registerBatchAgents() public {
        AgentRegistry.AgentParams[] memory paramsList = new AgentRegistry.AgentParams[](3);

        paramsList[0] = AgentRegistry.AgentParams({
            wallet: agentWallet1,
            name: "llm",
            ensName: "llm.perkmesh.eth",
            endpoint: "https://api.perkmesh.xyz/llm",
            price: 100,
            paymentModel: AgentRegistry.PaymentModel.Streaming,
            capabilities: "text-generation"
        });
        paramsList[1] = AgentRegistry.AgentParams({
            wallet: agentWallet2,
            name: "search",
            ensName: "search.perkmesh.eth",
            endpoint: "https://api.perkmesh.xyz/search",
            price: 1000,
            paymentModel: AgentRegistry.PaymentModel.RequestResponse,
            capabilities: "web-search"
        });
        paramsList[2] = AgentRegistry.AgentParams({
            wallet: agentWallet3,
            name: "worker-01",
            ensName: "worker-01.perkmesh.eth",
            endpoint: "",
            price: 0,
            paymentModel: AgentRegistry.PaymentModel.RequestResponse,
            capabilities: ""
        });

        registry.registerBatchAgents(paramsList);
        assertEq(registry.agentCount(), 3);

        AgentRegistry.Agent memory agent0 = registry.getAgent(0);
        assertEq(agent0.name, "llm");

        AgentRegistry.Agent memory agent1 = registry.getAgent(1);
        assertEq(agent1.name, "search");

        AgentRegistry.Agent memory agent2 = registry.getAgent(2);
        assertEq(agent2.name, "worker-01");
    }

    function test_registerAgent_revertNotOwner() public {
        vm.prank(agentWallet1);
        vm.expectRevert();
        registry.registerAgent(AgentRegistry.AgentParams({
            wallet: agentWallet1,
            name: "llm",
            ensName: "",
            endpoint: "",
            price: 0,
            paymentModel: AgentRegistry.PaymentModel.RequestResponse,
            capabilities: ""
        }));
    }

    function test_getAgentByWallet() public {
        _registerTestAgent(agentWallet1, "llm");
        AgentRegistry.Agent memory agent = registry.getAgentByWallet(agentWallet1);
        assertEq(agent.name, "llm");
    }

    // ================================================================
    // │ Status Update Tests                                           │
    // ================================================================

    function test_updateStatus_byOwner() public {
        _registerTestAgent(agentWallet1, "llm");

        registry.updateStatus(0, AgentRegistry.Status.Inactive);
        assertFalse(registry.isActive(0));

        registry.updateStatus(0, AgentRegistry.Status.Active);
        assertTrue(registry.isActive(0));
    }

    function test_updateStatus_byOperator() public {
        _registerTestAgent(agentWallet1, "llm");

        vm.prank(operator);
        registry.updateStatus(0, AgentRegistry.Status.Inactive);
        assertFalse(registry.isActive(0));
    }

    function test_updateStatus_revertUnauthorized() public {
        _registerTestAgent(agentWallet1, "llm");

        vm.prank(agentWallet2);
        vm.expectRevert(AgentRegistry.NotAuthorized.selector);
        registry.updateStatus(0, AgentRegistry.Status.Inactive);
    }

    // ================================================================
    // │ Price Update Tests                                            │
    // ================================================================

    function test_updatePrice() public {
        _registerTestAgent(agentWallet1, "llm");

        registry.updatePrice(0, 500);
        AgentRegistry.Agent memory agent = registry.getAgent(0);
        assertEq(agent.price, 500);
    }

    // ================================================================
    // │ Reputation Tests                                              │
    // ================================================================

    function test_incrementCompleted() public {
        _registerTestAgent(agentWallet1, "llm");

        registry.incrementCompleted(0, 15000); // earned $0.015
        registry.incrementCompleted(0, 8700);  // earned $0.0087

        (uint256 completed, uint256 rejected, uint256 total) = registry.getReputationScore(0);
        assertEq(completed, 2);
        assertEq(rejected, 0);
        assertEq(total, 2);

        AgentRegistry.Agent memory agent = registry.getAgent(0);
        assertEq(agent.totalEarned, 23700);
    }

    function test_incrementRejected() public {
        _registerTestAgent(agentWallet1, "llm");

        registry.incrementCompleted(0, 10000);
        registry.incrementRejected(0);

        (uint256 completed, uint256 rejected, uint256 total) = registry.getReputationScore(0);
        assertEq(completed, 1);
        assertEq(rejected, 1);
        assertEq(total, 2);
    }

    // ================================================================
    // │ CRE Report Tests                                              │
    // ================================================================

    function test_processReport_statusUpdate() public {
        _registerTestAgent(agentWallet1, "llm");
        assertTrue(registry.isActive(0));

        // Simulate CRE report: status update (reportType=1, agentId=0, status=0 inactive)
        bytes memory report = abi.encodePacked(
            uint8(1), // reportType = STATUS_UPDATE
            abi.encode(uint256(0), uint8(0)) // agentId=0, status=Inactive
        );

        // Call as forwarder (simulating CRE → KeystoneForwarder → onReport)
        vm.prank(forwarder);
        registry.onReport(new bytes(0), report);

        assertFalse(registry.isActive(0));
    }

    function test_processReport_priceUpdate() public {
        _registerTestAgent(agentWallet1, "llm");
        _registerTestAgent(agentWallet2, "search");

        // Simulate CRE report: batch price update
        uint256[] memory ids = new uint256[](2);
        ids[0] = 0;
        ids[1] = 1;
        uint256[] memory prices = new uint256[](2);
        prices[0] = 300;  // new price for llm
        prices[1] = 2000; // new price for search

        bytes memory report = abi.encodePacked(
            uint8(2), // reportType = PRICE_UPDATE
            abi.encode(ids, prices)
        );

        vm.prank(forwarder);
        registry.onReport(new bytes(0), report);

        assertEq(registry.getAgent(0).price, 300);
        assertEq(registry.getAgent(1).price, 2000);
    }

    function test_processReport_reputationUpdate() public {
        _registerTestAgent(agentWallet1, "llm");

        // Simulate CRE report: reputation (completed)
        bytes memory report = abi.encodePacked(
            uint8(3), // reportType = REPUTATION_UPDATE
            abi.encode(uint256(0), true, uint256(15000)) // agentId=0, completed=true, earned=15000
        );

        vm.prank(forwarder);
        registry.onReport(new bytes(0), report);

        (uint256 completed,,) = registry.getReputationScore(0);
        assertEq(completed, 1);
    }

    // ================================================================
    // │ Helpers                                                        │
    // ================================================================

    function _registerTestAgent(address wallet, string memory name) internal {
        registry.registerAgent(AgentRegistry.AgentParams({
            wallet: wallet,
            name: name,
            ensName: string.concat(name, ".perkmesh.eth"),
            endpoint: string.concat("https://api.perkmesh.xyz/", name),
            price: 100,
            paymentModel: AgentRegistry.PaymentModel.Streaming,
            capabilities: "test"
        }));
    }
}
