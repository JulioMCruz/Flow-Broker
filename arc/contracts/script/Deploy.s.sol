// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {PaymentAccumulator} from "../src/PaymentAccumulator.sol";
import {PricingOracle} from "../src/PricingOracle.sol";
import {AgenticCommerce} from "../src/AgenticCommerce.sol";
import {ReputationHook} from "../src/ReputationHook.sol";

contract Deploy is Script {
    // Arc Testnet addresses
    address constant USDC = 0x3600000000000000000000000000000000000000;
    // CRE MockKeystoneForwarder on Arc Testnet
    address constant FORWARDER = 0x6E9EE680ef59ef64Aa8C7371279c27E496b5eDc1;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerKey);

        // 1. AgentRegistry (needs forwarder for CRE writes)
        AgentRegistry registry = new AgentRegistry(FORWARDER);
        console.log("AgentRegistry:", address(registry));

        // 2. PaymentAccumulator (threshold: 100 payments, est gas: 50000 wei per tx)
        PaymentAccumulator accumulator = new PaymentAccumulator(100, 50000);
        console.log("PaymentAccumulator:", address(accumulator));

        // 3. PricingOracle (needs forwarder for CRE writes)
        PricingOracle oracle = new PricingOracle(FORWARDER);
        console.log("PricingOracle:", address(oracle));

        // 4. AgenticCommerce (ERC-8183, needs USDC, 0 fee, deployer as treasury)
        AgenticCommerce commerce = new AgenticCommerce(USDC, 0, deployer);
        console.log("AgenticCommerce:", address(commerce));

        // 5. ReputationHook (needs registry + commerce)
        ReputationHook hook = new ReputationHook(address(registry), address(commerce));
        console.log("ReputationHook:", address(hook));

        // Post-deploy setup
        // Set ReputationHook as operator in AgentRegistry (so it can update reputation)
        registry.setOperator(address(hook), true);
        console.log("ReputationHook set as operator in AgentRegistry");

        // Deployer is already recorder by default (set in constructor)
        console.log("Deployer is recorder in PaymentAccumulator (default)");

        vm.stopBroadcast();

        console.log("");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("AgentRegistry:      ", address(registry));
        console.log("PaymentAccumulator:  ", address(accumulator));
        console.log("PricingOracle:       ", address(oracle));
        console.log("AgenticCommerce:     ", address(commerce));
        console.log("ReputationHook:      ", address(hook));
        console.log("USDC:                ", USDC);
        console.log("Forwarder:           ", FORWARDER);
    }
}
