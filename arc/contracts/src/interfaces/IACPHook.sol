// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title IACPHook — ERC-8183 Agentic Commerce Protocol Hook Interface
/// @notice Hook contract called before and after core ACP functions.
/// @dev Per ERC-8183 spec: hooks are trusted contracts chosen by client at job creation.
interface IACPHook {
    /// @notice Called before a core ACP function executes
    /// @param jobId The job being acted upon
    /// @param selector The function selector of the core function (e.g. fund, submit, complete)
    /// @param data Function-specific parameters encoded as bytes
    function beforeAction(uint256 jobId, bytes4 selector, bytes calldata data) external;

    /// @notice Called after a core ACP function completes (including state changes and transfers)
    /// @param jobId The job being acted upon
    /// @param selector The function selector of the core function
    /// @param data Function-specific parameters encoded as bytes
    function afterAction(uint256 jobId, bytes4 selector, bytes calldata data) external;
}
