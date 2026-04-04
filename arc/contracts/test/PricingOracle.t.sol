// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {PricingOracle} from "../src/PricingOracle.sol";

contract PricingOracleTest is Test {
    PricingOracle public oracle;

    address public owner = address(this);
    address public forwarder = makeAddr("forwarder");

    event PriceUpdated(uint256 indexed agentId, uint256 oldPrice, uint256 newPrice, uint256 timestamp);
    event BatchPriceUpdate(uint256 agentCount, uint256 timestamp);

    function setUp() public {
        oracle = new PricingOracle(forwarder);
    }

    // ================================================================
    // │ Initial Prices Tests                                          │
    // ================================================================

    function test_setInitialPrices() public {
        uint256[] memory ids = new uint256[](3);
        uint256[] memory prices = new uint256[](3);
        ids[0] = 0; prices[0] = 100;   // llm: $0.0001
        ids[1] = 1; prices[1] = 1000;  // search: $0.001
        ids[2] = 2; prices[2] = 500;   // embeddings: $0.0005

        oracle.setInitialPrices(ids, prices);

        (uint256 price0,) = oracle.getPrice(0);
        (uint256 price1,) = oracle.getPrice(1);
        (uint256 price2,) = oracle.getPrice(2);
        assertEq(price0, 100);
        assertEq(price1, 1000);
        assertEq(price2, 500);
    }

    function test_getBatchPrices() public {
        uint256[] memory ids = new uint256[](2);
        uint256[] memory prices = new uint256[](2);
        ids[0] = 0; prices[0] = 100;
        ids[1] = 1; prices[1] = 200;
        oracle.setInitialPrices(ids, prices);

        uint256[] memory queryIds = new uint256[](2);
        queryIds[0] = 0;
        queryIds[1] = 1;
        uint256[] memory result = oracle.getBatchPrices(queryIds);
        assertEq(result[0], 100);
        assertEq(result[1], 200);
    }

    // ================================================================
    // │ CRE Report Tests                                              │
    // ================================================================

    function test_processReport_updatesPrices() public {
        // Set initial prices
        uint256[] memory ids = new uint256[](2);
        uint256[] memory prices = new uint256[](2);
        ids[0] = 0; prices[0] = 100;
        ids[1] = 1; prices[1] = 1000;
        oracle.setInitialPrices(ids, prices);

        // Simulate CRE price update report
        uint256[] memory newIds = new uint256[](2);
        uint256[] memory newPrices = new uint256[](2);
        newIds[0] = 0; newPrices[0] = 300;   // llm: $0.0001 -> $0.0003
        newIds[1] = 1; newPrices[1] = 1500;  // search: $0.001 -> $0.0015

        bytes memory report = abi.encode(newIds, newPrices);

        vm.prank(forwarder);
        oracle.onReport(new bytes(0), report);

        (uint256 price0,) = oracle.getPrice(0);
        (uint256 price1,) = oracle.getPrice(1);
        assertEq(price0, 300);
        assertEq(price1, 1500);
        assertEq(oracle.totalUpdates(), 1);
    }

    function test_processReport_emitsEvents() public {
        uint256[] memory ids = new uint256[](1);
        uint256[] memory prices = new uint256[](1);
        ids[0] = 5; prices[0] = 999;

        bytes memory report = abi.encode(ids, prices);

        vm.prank(forwarder);
        vm.expectEmit(true, false, false, true);
        emit PriceUpdated(5, 0, 999, block.timestamp);
        oracle.onReport(new bytes(0), report);
    }

    function test_processReport_revertNotForwarder() public {
        uint256[] memory ids = new uint256[](1);
        uint256[] memory prices = new uint256[](1);
        ids[0] = 0; prices[0] = 100;

        bytes memory report = abi.encode(ids, prices);

        vm.prank(makeAddr("random"));
        vm.expectRevert();
        oracle.onReport(new bytes(0), report);
    }
}
