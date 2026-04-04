// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ReceiverTemplate} from "./interfaces/ReceiverTemplate.sol";

/// @title AgentRegistry
/// @notice Central registry for PerkMesh agent fleet — stores metadata, status, pricing, reputation.
/// @dev Extends ReceiverTemplate so CRE workflows can update agent state via KeystoneForwarder.
contract AgentRegistry is ReceiverTemplate {
    // ================================================================
    // │ Errors                                                        │
    // ================================================================
    error AgentNotFound(uint256 agentId);
    error AgentAlreadyExists(address wallet);
    error InvalidAgent();
    error NotAuthorized();

    // ================================================================
    // │ Events                                                        │
    // ================================================================
    event AgentRegistered(uint256 indexed agentId, string name, address indexed wallet);
    event AgentStatusUpdated(uint256 indexed agentId, uint8 oldStatus, uint8 newStatus);
    event AgentPriceUpdated(uint256 indexed agentId, uint256 oldPrice, uint256 newPrice);
    event AgentReputationUpdated(uint256 indexed agentId, uint256 completed, uint256 rejected);
    event AgentEndpointUpdated(uint256 indexed agentId, string newEndpoint);

    // ================================================================
    // │ Types                                                         │
    // ================================================================

    /// @notice Payment model for agent services
    enum PaymentModel {
        RequestResponse, // 0 = pay per call
        Streaming        // 1 = pay per token/second
    }

    /// @notice Agent status
    enum Status {
        Inactive, // 0
        Active    // 1
    }

    /// @notice Full agent data
    struct Agent {
        address wallet;
        string name;
        string ensName;
        string endpoint;
        uint256 price; // in USDC atomic units (6 decimals)
        Status status;
        PaymentModel paymentModel;
        string capabilities;
        uint256 totalJobsCompleted;
        uint256 totalJobsRejected;
        uint256 totalEarned;
        uint48 registeredAt;
    }

    /// @notice Params for registering a new agent
    struct AgentParams {
        address wallet;
        string name;
        string ensName;
        string endpoint;
        uint256 price;
        PaymentModel paymentModel;
        string capabilities;
    }

    // ================================================================
    // │ CRE Report Types                                              │
    // ================================================================
    uint8 public constant REPORT_STATUS_UPDATE = 1;
    uint8 public constant REPORT_PRICE_UPDATE = 2;
    uint8 public constant REPORT_REPUTATION_UPDATE = 3;

    // ================================================================
    // │ Storage                                                       │
    // ================================================================
    mapping(uint256 => Agent) public agents;
    mapping(address => uint256) public agentByWallet;
    uint256 public agentCount;

    /// @notice Addresses allowed to update agent state (backend, hooks)
    mapping(address => bool) public operators;

    // ================================================================
    // │ Constructor                                                    │
    // ================================================================

    /// @param _forwarderAddress Chainlink KeystoneForwarder on Arc Testnet
    constructor(address _forwarderAddress) ReceiverTemplate(_forwarderAddress) {
        operators[msg.sender] = true;
    }

    // ================================================================
    // │ Modifiers                                                     │
    // ================================================================

    modifier onlyOperatorOrOwner() {
        if (msg.sender != owner() && !operators[msg.sender]) revert NotAuthorized();
        _;
    }

    modifier agentExists(uint256 agentId) {
        if (agents[agentId].wallet == address(0)) revert AgentNotFound(agentId);
        _;
    }

    // ================================================================
    // │ Admin Functions                                                │
    // ================================================================

    /// @notice Register a single agent
    function registerAgent(AgentParams calldata params) external onlyOwner returns (uint256 agentId) {
        if (params.wallet == address(0)) revert InvalidAgent();
        if (agentByWallet[params.wallet] != 0 && agents[agentByWallet[params.wallet]].wallet != address(0)) {
            revert AgentAlreadyExists(params.wallet);
        }

        agentId = agentCount++;
        agents[agentId] = Agent({
            wallet: params.wallet,
            name: params.name,
            ensName: params.ensName,
            endpoint: params.endpoint,
            price: params.price,
            status: Status.Active,
            paymentModel: params.paymentModel,
            capabilities: params.capabilities,
            totalJobsCompleted: 0,
            totalJobsRejected: 0,
            totalEarned: 0,
            registeredAt: uint48(block.timestamp)
        });
        agentByWallet[params.wallet] = agentId;

        emit AgentRegistered(agentId, params.name, params.wallet);
    }

    /// @notice Batch register agents (for initial 50-agent setup)
    function registerBatchAgents(AgentParams[] calldata paramsList) external onlyOwner {
        for (uint256 i = 0; i < paramsList.length; i++) {
            AgentParams calldata params = paramsList[i];
            if (params.wallet == address(0)) continue;

            uint256 agentId = agentCount++;
            agents[agentId] = Agent({
                wallet: params.wallet,
                name: params.name,
                ensName: params.ensName,
                endpoint: params.endpoint,
                price: params.price,
                status: Status.Active,
                paymentModel: params.paymentModel,
                capabilities: params.capabilities,
                totalJobsCompleted: 0,
                totalJobsRejected: 0,
                totalEarned: 0,
                registeredAt: uint48(block.timestamp)
            });
            agentByWallet[params.wallet] = agentId;

            emit AgentRegistered(agentId, params.name, params.wallet);
        }
    }

    /// @notice Set operator (backend, hooks, etc.)
    function setOperator(address operator, bool allowed) external onlyOwner {
        operators[operator] = allowed;
    }

    // ================================================================
    // │ State Updates (by operators, owner, or CRE)                   │
    // ================================================================

    /// @notice Update agent status (active/inactive)
    function updateStatus(uint256 agentId, Status newStatus) external onlyOperatorOrOwner agentExists(agentId) {
        Status old = agents[agentId].status;
        agents[agentId].status = newStatus;
        emit AgentStatusUpdated(agentId, uint8(old), uint8(newStatus));
    }

    /// @notice Update agent price
    function updatePrice(uint256 agentId, uint256 newPrice) external onlyOperatorOrOwner agentExists(agentId) {
        uint256 old = agents[agentId].price;
        agents[agentId].price = newPrice;
        emit AgentPriceUpdated(agentId, old, newPrice);
    }

    /// @notice Update agent endpoint
    function updateEndpoint(uint256 agentId, string calldata newEndpoint) external onlyOperatorOrOwner agentExists(agentId) {
        agents[agentId].endpoint = newEndpoint;
        emit AgentEndpointUpdated(agentId, newEndpoint);
    }

    /// @notice Increment completed jobs (called by ReputationHook)
    function incrementCompleted(uint256 agentId, uint256 earned) external onlyOperatorOrOwner agentExists(agentId) {
        agents[agentId].totalJobsCompleted++;
        agents[agentId].totalEarned += earned;
        emit AgentReputationUpdated(agentId, agents[agentId].totalJobsCompleted, agents[agentId].totalJobsRejected);
    }

    /// @notice Increment rejected jobs (called by ReputationHook)
    function incrementRejected(uint256 agentId) external onlyOperatorOrOwner agentExists(agentId) {
        agents[agentId].totalJobsRejected++;
        emit AgentReputationUpdated(agentId, agents[agentId].totalJobsCompleted, agents[agentId].totalJobsRejected);
    }

    // ================================================================
    // │ Read Functions                                                │
    // ================================================================

    /// @notice Get full agent data
    function getAgent(uint256 agentId) external view returns (Agent memory) {
        return agents[agentId];
    }

    /// @notice Get agent by wallet address
    function getAgentByWallet(address wallet) external view returns (Agent memory) {
        return agents[agentByWallet[wallet]];
    }

    /// @notice Get agent ID by wallet
    function getAgentIdByWallet(address wallet) external view returns (uint256) {
        return agentByWallet[wallet];
    }

    /// @notice Check if agent is active
    function isActive(uint256 agentId) external view returns (bool) {
        return agents[agentId].status == Status.Active;
    }

    /// @notice Get reputation score (completed / (completed + rejected))
    function getReputationScore(uint256 agentId) external view returns (uint256 completed, uint256 rejected, uint256 total) {
        Agent storage agent = agents[agentId];
        completed = agent.totalJobsCompleted;
        rejected = agent.totalJobsRejected;
        total = completed + rejected;
    }

    // ================================================================
    // │ CRE Integration (ReceiverTemplate)                            │
    // ================================================================

    /// @notice Process reports from CRE workflows via KeystoneForwarder
    /// @dev Report format: abi.encode(uint8 reportType, bytes data)
    ///   reportType 1 = status update: data = abi.encode(uint256 agentId, uint8 status)
    ///   reportType 2 = price update: data = abi.encode(uint256[] agentIds, uint256[] prices)
    ///   reportType 3 = reputation: data = abi.encode(uint256 agentId, bool completed, uint256 earned)
    function _processReport(bytes calldata report) internal override {
        uint8 reportType = uint8(report[0]);
        bytes calldata data = report[1:];

        if (reportType == REPORT_STATUS_UPDATE) {
            (uint256 agentId, uint8 newStatus) = abi.decode(data, (uint256, uint8));
            if (agents[agentId].wallet != address(0)) {
                Status old = agents[agentId].status;
                agents[agentId].status = Status(newStatus);
                emit AgentStatusUpdated(agentId, uint8(old), newStatus);
            }
        } else if (reportType == REPORT_PRICE_UPDATE) {
            (uint256[] memory agentIds, uint256[] memory prices) = abi.decode(data, (uint256[], uint256[]));
            for (uint256 i = 0; i < agentIds.length; i++) {
                if (agents[agentIds[i]].wallet != address(0)) {
                    uint256 old = agents[agentIds[i]].price;
                    agents[agentIds[i]].price = prices[i];
                    emit AgentPriceUpdated(agentIds[i], old, prices[i]);
                }
            }
        } else if (reportType == REPORT_REPUTATION_UPDATE) {
            (uint256 agentId, bool completed, uint256 earned) = abi.decode(data, (uint256, bool, uint256));
            if (agents[agentId].wallet != address(0)) {
                if (completed) {
                    agents[agentId].totalJobsCompleted++;
                    agents[agentId].totalEarned += earned;
                } else {
                    agents[agentId].totalJobsRejected++;
                }
                emit AgentReputationUpdated(agentId, agents[agentId].totalJobsCompleted, agents[agentId].totalJobsRejected);
            }
        }
    }
}
