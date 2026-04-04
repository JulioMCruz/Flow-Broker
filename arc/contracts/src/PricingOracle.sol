// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ReceiverTemplate} from "./interfaces/ReceiverTemplate.sol";

/// @title PricingOracle
/// @notice Receives price updates from CRE Dynamic Pricing workflow. Agents read current prices from here.
/// @dev Extends ReceiverTemplate so CRE can write via KeystoneForwarder → onReport() → _processReport()
contract PricingOracle is ReceiverTemplate {
    event PriceUpdated(uint256 indexed agentId, uint256 oldPrice, uint256 newPrice, uint256 timestamp);
    event BatchPriceUpdate(uint256 agentCount, uint256 timestamp);


    /// @notice Current price per agent (USDC atomic units, 6 decimals)
    mapping(uint256 => uint256) public agentPrices;

    /// @notice Last update timestamp per agent
    mapping(uint256 => uint256) public lastUpdated;

    /// @notice Total price updates received
    uint256 public totalUpdates;


    /// @param _forwarderAddress Chainlink KeystoneForwarder on Arc Testnet
    constructor(address _forwarderAddress) ReceiverTemplate(_forwarderAddress) {}


    /// @notice Set initial prices for agents (batch, by owner)
    function setInitialPrices(uint256[] calldata agentIds, uint256[] calldata prices) external onlyOwner {
        require(agentIds.length == prices.length, "Length mismatch");
        for (uint256 i = 0; i < agentIds.length; i++) {
            uint256 old = agentPrices[agentIds[i]];
            agentPrices[agentIds[i]] = prices[i];
            lastUpdated[agentIds[i]] = block.timestamp;
            emit PriceUpdated(agentIds[i], old, prices[i], block.timestamp);
        }
    }


    /// @notice Get current price for an agent
    function getPrice(uint256 agentId) external view returns (uint256 price, uint256 updatedAt) {
        return (agentPrices[agentId], lastUpdated[agentId]);
    }

    /// @notice Get prices for multiple agents
    function getBatchPrices(uint256[] calldata agentIds) external view returns (uint256[] memory prices) {
        prices = new uint256[](agentIds.length);
        for (uint256 i = 0; i < agentIds.length; i++) {
            prices[i] = agentPrices[agentIds[i]];
        }
    }


    /// @notice Process price update reports from CRE Dynamic Pricing workflow
    /// @dev Report format: abi.encode(uint256[] agentIds, uint256[] prices)
    function _processReport(bytes calldata report) internal override {
        (uint256[] memory agentIds, uint256[] memory prices) = abi.decode(report, (uint256[], uint256[]));
        require(agentIds.length == prices.length, "Length mismatch");

        for (uint256 i = 0; i < agentIds.length; i++) {
            uint256 old = agentPrices[agentIds[i]];
            agentPrices[agentIds[i]] = prices[i];
            lastUpdated[agentIds[i]] = block.timestamp;
            emit PriceUpdated(agentIds[i], old, prices[i], block.timestamp);
        }

        totalUpdates++;
        emit BatchPriceUpdate(agentIds.length, block.timestamp);
    }
}
