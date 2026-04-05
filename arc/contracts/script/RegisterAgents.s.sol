// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";

interface IIdentityRegistry {
    function registerAgent(
        address agentAddress,
        string calldata name,
        string calldata agentType,
        string calldata metadataURI
    ) external returns (uint256 tokenId);
    
    function balanceOf(address owner) external view returns (uint256);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

contract RegisterAgents is Script {
    // ERC-8004 official contracts on Arc Testnet
    address constant IDENTITY_REGISTRY = 0x8004A818BFB912233c491871b3d84c89A494BD9e;
    
    // Broker wallets (workers)
    address[8] BROKERS = [
        0xea108a5074772f700Dc84c76F180b11285be6d8d, // Guardian
        0x225F28E9c6d4E9a2DB8E2b007BEc91716E331efB, // Sentinel
        0xbe3359304457A8C0C443Ad412E65f7d4aADC405e, // Steady
        0x1eE2cfc2b77D388B451F7Dd74982391e0bB3BaD5, // Navigator
        0xa9624B279640F36aDCAd3845447d40bbe6eb7E5B, // Growth
        0x92Cd4862E054e3F426818D1883b92A9321Ae6Ba5, // Momentum
        0x5c10Adf159D45D1A3874882d36cdacA722C000c9, // Apex
        0x3004B4add68C3753Ecd5f18edD93EE999Ffaff3e  // Titan
    ];
    
    string[8] NAMES = [
        "Guardian", "Sentinel", "Steady", "Navigator",
        "Growth", "Momentum", "Apex", "Titan"
    ];
    
    string[8] METADATA_URIS = [
        "https://sepolia.app.ens.domains/guardian.flowbroker.eth",
        "https://sepolia.app.ens.domains/sentinel.flowbroker.eth",
        "https://sepolia.app.ens.domains/steady.flowbroker.eth",
        "https://sepolia.app.ens.domains/navigator.flowbroker.eth",
        "https://sepolia.app.ens.domains/growth.flowbroker.eth",
        "https://sepolia.app.ens.domains/momentum.flowbroker.eth",
        "https://sepolia.app.ens.domains/apex.flowbroker.eth",
        "https://sepolia.app.ens.domains/titan.flowbroker.eth"
    ];

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        IIdentityRegistry registry = IIdentityRegistry(IDENTITY_REGISTRY);
        
        console.log("Registering 8 Flow Broker agents on ERC-8004...");
        console.log("IdentityRegistry:", IDENTITY_REGISTRY);
        
        for (uint i = 0; i < 8; i++) {
            try registry.registerAgent(
                BROKERS[i],
                NAMES[i],
                "broker",
                METADATA_URIS[i]
            ) returns (uint256 tokenId) {
                console.log("Registered:", NAMES[i], "tokenId:", tokenId, "wallet:", BROKERS[i]);
            } catch (bytes memory err) {
                console.log("Failed:", NAMES[i], "error:", string(err));
            }
        }
        
        vm.stopBroadcast();
        console.log("Done! Verify at: https://testnet.arcscan.app/address", IDENTITY_REGISTRY);
    }
}
