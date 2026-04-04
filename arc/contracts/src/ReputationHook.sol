// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IACPHook} from "./interfaces/IACPHook.sol";
import {AgentRegistry} from "./AgentRegistry.sol";

/// @title ReputationHook
/// @notice ERC-8183 hook that updates agent reputation in AgentRegistry after job completion or rejection.
/// @dev Attached to jobs at creation. Called by AgenticCommerce before/after core functions.
contract ReputationHook is IACPHook {
    // ================================================================
    // │ Errors                                                        │
    // ================================================================
    error OnlyACP();

    // ================================================================
    // │ Events                                                        │
    // ================================================================
    event ReputationIncremented(uint256 indexed jobId, uint256 indexed agentId, bool completed);

    // ================================================================
    // │ Storage                                                       │
    // ================================================================

    /// @notice The AgentRegistry contract
    AgentRegistry public immutable registry;

    /// @notice The AgenticCommerce contract (only this can call hook functions)
    address public immutable agenticCommerce;

    // ================================================================
    // │ Function Selectors (must match AgenticCommerce)                │
    // ================================================================
    bytes4 public constant COMPLETE_SELECTOR = bytes4(keccak256("complete(uint256,bytes32,bytes)"));
    bytes4 public constant REJECT_SELECTOR = bytes4(keccak256("reject(uint256,bytes32,bytes)"));

    // ================================================================
    // │ Constructor                                                    │
    // ================================================================

    /// @param _registry AgentRegistry contract address
    /// @param _agenticCommerce AgenticCommerce contract address
    constructor(address _registry, address _agenticCommerce) {
        registry = AgentRegistry(_registry);
        agenticCommerce = _agenticCommerce;
    }

    // ================================================================
    // │ Modifiers                                                     │
    // ================================================================

    modifier onlyACP() {
        if (msg.sender != agenticCommerce) revert OnlyACP();
        _;
    }

    // ================================================================
    // │ IACPHook Implementation                                       │
    // ================================================================

    /// @notice Before action — no pre-checks needed for reputation tracking
    function beforeAction(uint256, bytes4, bytes calldata) external view onlyACP {
        // No pre-validation needed
    }

    /// @notice After action — update reputation on complete or reject
    /// @dev On complete: increment provider's completed count + earned amount
    ///      On reject (when Submitted): increment provider's rejected count
    function afterAction(uint256 jobId, bytes4 selector, bytes calldata data) external onlyACP {
        if (selector == COMPLETE_SELECTOR) {
            _onJobCompleted(jobId, data);
        } else if (selector == REJECT_SELECTOR) {
            _onJobRejected(jobId, data);
        }
        // Other selectors (fund, submit, etc.) — no reputation action needed
    }

    // ================================================================
    // │ Internal                                                      │
    // ================================================================

    /// @notice Handle job completion — reward provider reputation
    function _onJobCompleted(uint256 jobId, bytes calldata) internal {
        (address provider, uint256 budget) = _getProviderAndBudget(jobId);
        if (provider == address(0)) return;

        uint256 agentId = registry.getAgentIdByWallet(provider);
        registry.incrementCompleted(agentId, budget);

        emit ReputationIncremented(jobId, agentId, true);
    }

    /// @notice Handle job rejection — penalize provider reputation
    function _onJobRejected(uint256 jobId, bytes calldata) internal {
        (address provider,) = _getProviderAndBudget(jobId);
        if (provider == address(0)) return;

        uint256 agentId = registry.getAgentIdByWallet(provider);
        registry.incrementRejected(agentId);

        emit ReputationIncremented(jobId, agentId, false);
    }

    /// @notice Read provider and budget from AgenticCommerce
    function _getProviderAndBudget(uint256 jobId) internal view returns (address provider, uint256 budget) {
        (bool success, bytes memory data) = agenticCommerce.staticcall(
            abi.encodeWithSignature("getJob(uint256)", jobId)
        );
        require(success, "Failed to read job");
        // Decode only what we need — provider is 2nd field, budget is 5th
        assembly {
            // Skip first 32 bytes (abi offset), then: client(32) + provider(32)
            provider := mload(add(data, 96))  // offset 32 + 32 (client) = 64, +32 for length = 96
            budget := mload(add(data, 192))   // offset 32 + 32*4 = 160, +32 for length = 192
        }
    }
}
