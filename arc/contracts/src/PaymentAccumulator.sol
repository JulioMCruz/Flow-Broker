// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title PaymentAccumulator
/// @notice Tracks nanopayment activity for PerkMesh. Emits threshold events for CRE Log Trigger.
/// @dev Called by the backend after each x402 payment is verified. Not involved in actual settlement
///      (Circle Gateway handles that). This contract is purely for tracking and triggering CRE workflows.
contract PaymentAccumulator is Ownable {
    // ================================================================
    // │ Errors                                                        │
    // ================================================================
    error NotAuthorized();
    error InvalidAmount();

    // ================================================================
    // │ Events                                                        │
    // ================================================================

    /// @notice Emitted for each recorded payment (dashboard uses this)
    event PaymentRecorded(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 timestamp
    );

    /// @notice Emitted when payment count reaches threshold — CRE Log Trigger listens for this
    event PaymentThresholdReached(
        uint256 indexed batchId,
        uint256 count,
        uint256 totalAmount
    );

    /// @notice Emitted when a batch settlement is recorded
    event BatchSettled(
        uint256 indexed batchId,
        uint256 paymentCount,
        uint256 totalAmount,
        bytes32 txHash,
        uint256 gasSaved
    );

    // ================================================================
    // │ Storage                                                       │
    // ================================================================

    /// @notice Current batch counters (reset on threshold)
    uint256 public currentBatchPaymentCount;
    uint256 public currentBatchTotalAmount;

    /// @notice Lifetime counters
    uint256 public totalLifetimePayments;
    uint256 public totalLifetimeVolume;
    uint256 public totalBatchesSettled;

    /// @notice Threshold to trigger CRE settlement monitoring
    uint256 public paymentThreshold;

    /// @notice Current batch ID
    uint256 public currentBatchId;

    /// @notice Estimated gas cost per individual transaction (for "gas saved" calculation)
    uint256 public estimatedGasPerTx;

    /// @notice Authorized recorders (backend services)
    mapping(address => bool) public recorders;

    // ================================================================
    // │ Constructor                                                    │
    // ================================================================

    /// @param _threshold Number of payments before emitting threshold event
    /// @param _estimatedGasPerTx Estimated gas cost per individual settlement tx (for display)
    constructor(
        uint256 _threshold,
        uint256 _estimatedGasPerTx
    ) Ownable(msg.sender) {
        paymentThreshold = _threshold;
        estimatedGasPerTx = _estimatedGasPerTx;
        recorders[msg.sender] = true;
    }

    // ================================================================
    // │ Modifiers                                                     │
    // ================================================================

    modifier onlyRecorder() {
        if (!recorders[msg.sender] && msg.sender != owner()) revert NotAuthorized();
        _;
    }

    // ================================================================
    // │ Admin                                                         │
    // ================================================================

    /// @notice Set authorized recorder address
    function setRecorder(address recorder, bool allowed) external onlyOwner {
        recorders[recorder] = allowed;
    }

    /// @notice Update payment threshold
    function setThreshold(uint256 newThreshold) external onlyOwner {
        paymentThreshold = newThreshold;
    }

    /// @notice Update estimated gas per tx
    function setEstimatedGasPerTx(uint256 newEstimate) external onlyOwner {
        estimatedGasPerTx = newEstimate;
    }

    // ================================================================
    // │ Record Payments                                               │
    // ================================================================

    /// @notice Record a single nanopayment (called by backend after x402 verification)
    /// @param from Buyer agent address
    /// @param to Seller agent address
    /// @param amount Payment amount in USDC atomic units
    function recordPayment(address from, address to, uint256 amount) external onlyRecorder {
        if (amount == 0) revert InvalidAmount();

        currentBatchPaymentCount++;
        currentBatchTotalAmount += amount;
        totalLifetimePayments++;
        totalLifetimeVolume += amount;

        emit PaymentRecorded(from, to, amount, block.timestamp);

        // Check if threshold reached → emit event for CRE Log Trigger
        if (currentBatchPaymentCount >= paymentThreshold) {
            emit PaymentThresholdReached(
                currentBatchId,
                currentBatchPaymentCount,
                currentBatchTotalAmount
            );
        }
    }

    /// @notice Record multiple payments in one tx (gas efficient for batch recording)
    /// @param froms Array of buyer addresses
    /// @param tos Array of seller addresses
    /// @param amounts Array of payment amounts
    function recordBatchPayments(
        address[] calldata froms,
        address[] calldata tos,
        uint256[] calldata amounts
    ) external onlyRecorder {
        uint256 len = froms.length;
        for (uint256 i = 0; i < len; i++) {
            currentBatchPaymentCount++;
            currentBatchTotalAmount += amounts[i];
            totalLifetimePayments++;
            totalLifetimeVolume += amounts[i];

            emit PaymentRecorded(froms[i], tos[i], amounts[i], block.timestamp);
        }

        // Check threshold after batch
        if (currentBatchPaymentCount >= paymentThreshold) {
            emit PaymentThresholdReached(
                currentBatchId,
                currentBatchPaymentCount,
                currentBatchTotalAmount
            );
        }
    }

    // ================================================================
    // │ Settlement Recording                                          │
    // ================================================================

    /// @notice Record that Circle Gateway settled a batch (called by backend or CRE)
    /// @param txHash The on-chain transaction hash of the batch settlement
    function recordBatchSettlement(bytes32 txHash) external onlyRecorder {
        uint256 gasSaved = currentBatchPaymentCount * estimatedGasPerTx;

        emit BatchSettled(
            currentBatchId,
            currentBatchPaymentCount,
            currentBatchTotalAmount,
            txHash,
            gasSaved
        );

        totalBatchesSettled++;

        // Reset for next batch
        currentBatchId++;
        currentBatchPaymentCount = 0;
        currentBatchTotalAmount = 0;
    }

    // ================================================================
    // │ Read Functions                                                │
    // ================================================================

    /// @notice Get current batch stats
    function getCurrentBatchStats()
        external
        view
        returns (uint256 batchId, uint256 count, uint256 amount, uint256 threshold_)
    {
        return (currentBatchId, currentBatchPaymentCount, currentBatchTotalAmount, paymentThreshold);
    }

    /// @notice Get lifetime stats
    function getLifetimeStats()
        external
        view
        returns (uint256 payments, uint256 volume, uint256 batches, uint256 gasSaved)
    {
        return (
            totalLifetimePayments,
            totalLifetimeVolume,
            totalBatchesSettled,
            totalLifetimePayments * estimatedGasPerTx
        );
    }
}
