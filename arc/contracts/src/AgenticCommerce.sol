// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IACPHook} from "./interfaces/IACPHook.sol";

/// @title AgenticCommerce
/// @notice ERC-8183 Agentic Commerce Protocol — Job escrow with evaluator attestation for agent commerce.
/// @dev Implements the full ERC-8183 state machine: Open → Funded → Submitted → Completed/Rejected/Expired
contract AgenticCommerce is Ownable {
    using SafeERC20 for IERC20;

    error JobNotFound();
    error InvalidState(JobStatus current, JobStatus expected);
    error NotClient();
    error NotProvider();
    error NotEvaluator();
    error NotClientOrEvaluator();
    error InvalidEvaluator();
    error InvalidExpiry();
    error ProviderNotSet();
    error ProviderAlreadySet();
    error BudgetMismatch();
    error BudgetNotSet();
    error JobNotExpired();
    error ZeroAddress();
    error ZeroBudget();

    event JobCreated(uint256 indexed jobId, address indexed client, address provider, address evaluator, string description);
    event ProviderSet(uint256 indexed jobId, address indexed provider);
    event BudgetSet(uint256 indexed jobId, uint256 amount, address setter);
    event JobFunded(uint256 indexed jobId, uint256 amount);
    event JobSubmitted(uint256 indexed jobId, bytes32 deliverable);
    event JobCompleted(uint256 indexed jobId, bytes32 reason);
    event JobRejected(uint256 indexed jobId, bytes32 reason, address rejector);
    event JobExpired(uint256 indexed jobId);


    enum JobStatus {
        Open,       // 0 - Created, not yet funded
        Funded,     // 1 - Budget escrowed
        Submitted,  // 2 - Provider submitted work
        Completed,  // 3 - Terminal: payment released
        Rejected,   // 4 - Terminal: refunded
        Expired     // 5 - Terminal: refunded (timeout)
    }

    struct Job {
        address client;
        address provider;
        address evaluator;
        address hook;           // IACPHook (address(0) = no hook)
        uint256 budget;
        uint256 expiredAt;
        JobStatus status;
        string description;
        bytes32 deliverable;    // set on submit
    }


    /// @notice Payment token (USDC on Arc)
    IERC20 public immutable paymentToken;

    /// @notice All jobs
    mapping(uint256 => Job) public jobs;
    uint256 public jobCount;

    /// @notice Optional platform fee (basis points, e.g. 100 = 1%)
    uint256 public feeBps;
    address public treasury;

    bytes4 public constant SET_PROVIDER_SELECTOR = bytes4(keccak256("setProvider(uint256,address,bytes)"));
    bytes4 public constant SET_BUDGET_SELECTOR = bytes4(keccak256("setBudget(uint256,uint256,bytes)"));
    bytes4 public constant FUND_SELECTOR = bytes4(keccak256("fund(uint256,uint256,bytes)"));
    bytes4 public constant SUBMIT_SELECTOR = bytes4(keccak256("submit(uint256,bytes32,bytes)"));
    bytes4 public constant COMPLETE_SELECTOR = bytes4(keccak256("complete(uint256,bytes32,bytes)"));
    bytes4 public constant REJECT_SELECTOR = bytes4(keccak256("reject(uint256,bytes32,bytes)"));


    /// @param _paymentToken USDC address on Arc Testnet
    /// @param _feeBps Platform fee in basis points (0 = no fee)
    /// @param _treasury Fee recipient address
    constructor(address _paymentToken, uint256 _feeBps, address _treasury) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
        feeBps = _feeBps;
        treasury = _treasury;
    }


    /// @notice Create a new job
    /// @param provider Provider address (can be address(0) for bidding flow)
    /// @param evaluator Evaluator address (MUST not be zero)
    /// @param expiredAt Timestamp when job expires
    /// @param description Job description
    /// @param hook Optional hook contract (address(0) = no hook)
    function createJob(
        address provider,
        address evaluator,
        uint256 expiredAt,
        string calldata description,
        address hook
    ) external returns (uint256 jobId) {
        if (evaluator == address(0)) revert InvalidEvaluator();
        if (expiredAt <= block.timestamp) revert InvalidExpiry();

        jobId = jobCount++;
        jobs[jobId] = Job({
            client: msg.sender,
            provider: provider,
            evaluator: evaluator,
            hook: hook,
            budget: 0,
            expiredAt: expiredAt,
            status: JobStatus.Open,
            description: description,
            deliverable: bytes32(0)
        });

        emit JobCreated(jobId, msg.sender, provider, evaluator, description);
    }

    /// @notice Set provider (when created with provider=0, bidding flow)
    function setProvider(uint256 jobId, address provider, bytes calldata optParams) external {
        Job storage job = jobs[jobId];
        if (job.client == address(0)) revert JobNotFound();
        if (job.status != JobStatus.Open) revert InvalidState(job.status, JobStatus.Open);
        if (msg.sender != job.client) revert NotClient();
        if (job.provider != address(0)) revert ProviderAlreadySet();
        if (provider == address(0)) revert ZeroAddress();

        _beforeHook(jobId, job.hook, SET_PROVIDER_SELECTOR, abi.encode(provider, optParams));

        job.provider = provider;

        _afterHook(jobId, job.hook, SET_PROVIDER_SELECTOR, abi.encode(provider, optParams));

        emit ProviderSet(jobId, provider);
    }

    /// @notice Set budget (client or provider can negotiate)
    function setBudget(uint256 jobId, uint256 amount, bytes calldata optParams) external {
        Job storage job = jobs[jobId];
        if (job.client == address(0)) revert JobNotFound();
        if (job.status != JobStatus.Open) revert InvalidState(job.status, JobStatus.Open);
        if (msg.sender != job.client && msg.sender != job.provider) revert NotClientOrEvaluator();

        _beforeHook(jobId, job.hook, SET_BUDGET_SELECTOR, abi.encode(amount, optParams));

        job.budget = amount;

        _afterHook(jobId, job.hook, SET_BUDGET_SELECTOR, abi.encode(amount, optParams));

        emit BudgetSet(jobId, amount, msg.sender);
    }

    /// @notice Fund job escrow (client locks USDC)
    function fund(uint256 jobId, uint256 expectedBudget, bytes calldata optParams) external {
        Job storage job = jobs[jobId];
        if (job.client == address(0)) revert JobNotFound();
        if (job.status != JobStatus.Open) revert InvalidState(job.status, JobStatus.Open);
        if (msg.sender != job.client) revert NotClient();
        if (job.provider == address(0)) revert ProviderNotSet();
        if (job.budget == 0) revert BudgetNotSet();
        if (job.budget != expectedBudget) revert BudgetMismatch();

        _beforeHook(jobId, job.hook, FUND_SELECTOR, optParams);

        paymentToken.safeTransferFrom(msg.sender, address(this), job.budget);
        job.status = JobStatus.Funded;

        _afterHook(jobId, job.hook, FUND_SELECTOR, optParams);

        emit JobFunded(jobId, job.budget);
    }

    /// @notice Provider submits work deliverable
    function submit(uint256 jobId, bytes32 deliverable, bytes calldata optParams) external {
        Job storage job = jobs[jobId];
        if (job.client == address(0)) revert JobNotFound();
        if (job.status != JobStatus.Funded) revert InvalidState(job.status, JobStatus.Funded);
        if (msg.sender != job.provider) revert NotProvider();

        _beforeHook(jobId, job.hook, SUBMIT_SELECTOR, abi.encode(deliverable, optParams));

        job.status = JobStatus.Submitted;
        job.deliverable = deliverable;

        _afterHook(jobId, job.hook, SUBMIT_SELECTOR, abi.encode(deliverable, optParams));

        emit JobSubmitted(jobId, deliverable);
    }

    /// @notice Evaluator completes job (releases payment to provider)
    function complete(uint256 jobId, bytes32 reason, bytes calldata optParams) external {
        Job storage job = jobs[jobId];
        if (job.client == address(0)) revert JobNotFound();
        if (job.status != JobStatus.Submitted) revert InvalidState(job.status, JobStatus.Submitted);
        if (msg.sender != job.evaluator) revert NotEvaluator();

        _beforeHook(jobId, job.hook, COMPLETE_SELECTOR, abi.encode(reason, optParams));

        job.status = JobStatus.Completed;

        // Calculate fee and payment
        uint256 fee = (job.budget * feeBps) / 10000;
        uint256 payment = job.budget - fee;

        paymentToken.safeTransfer(job.provider, payment);
        if (fee > 0 && treasury != address(0)) {
            paymentToken.safeTransfer(treasury, fee);
        }

        _afterHook(jobId, job.hook, COMPLETE_SELECTOR, abi.encode(reason, optParams));

        emit JobCompleted(jobId, reason);
    }

    /// @notice Reject job (client when Open, evaluator when Funded/Submitted)
    function reject(uint256 jobId, bytes32 reason, bytes calldata optParams) external {
        Job storage job = jobs[jobId];
        if (job.client == address(0)) revert JobNotFound();

        // Client can reject when Open
        if (job.status == JobStatus.Open) {
            if (msg.sender != job.client) revert NotClient();
        }
        // Evaluator can reject when Funded or Submitted
        else if (job.status == JobStatus.Funded || job.status == JobStatus.Submitted) {
            if (msg.sender != job.evaluator) revert NotEvaluator();
        } else {
            revert InvalidState(job.status, JobStatus.Open);
        }

        _beforeHook(jobId, job.hook, REJECT_SELECTOR, abi.encode(reason, optParams));

        // Refund if funded
        if (job.status == JobStatus.Funded || job.status == JobStatus.Submitted) {
            paymentToken.safeTransfer(job.client, job.budget);
        }

        job.status = JobStatus.Rejected;

        _afterHook(jobId, job.hook, REJECT_SELECTOR, abi.encode(reason, optParams));

        emit JobRejected(jobId, reason, msg.sender);
    }

    /// @notice Claim refund after job expiry
    function claimRefund(uint256 jobId) external {
        Job storage job = jobs[jobId];
        if (job.client == address(0)) revert JobNotFound();
        if (job.status != JobStatus.Funded && job.status != JobStatus.Submitted) {
            revert InvalidState(job.status, JobStatus.Funded);
        }
        if (block.timestamp < job.expiredAt) revert JobNotExpired();

        // claimRefund is NOT hookable (per ERC-8183 spec — safety guarantee)
        paymentToken.safeTransfer(job.client, job.budget);
        job.status = JobStatus.Expired;

        emit JobExpired(jobId);
    }


    function getJob(uint256 jobId) external view returns (Job memory) {
        return jobs[jobId];
    }


    function _beforeHook(uint256 jobId, address hook, bytes4 selector, bytes memory data) internal {
        if (hook != address(0)) {
            IACPHook(hook).beforeAction(jobId, selector, data);
        }
    }

    function _afterHook(uint256 jobId, address hook, bytes4 selector, bytes memory data) internal {
        if (hook != address(0)) {
            IACPHook(hook).afterAction(jobId, selector, data);
        }
    }


    function setFee(uint256 _feeBps, address _treasury) external onlyOwner {
        feeBps = _feeBps;
        treasury = _treasury;
    }
}
