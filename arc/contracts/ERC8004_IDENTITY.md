# ERC-8004 Agent Identity — Flow Broker

All 8 broker agents are registered on the official ERC-8004 IdentityRegistry on Arc Testnet.

## IdentityRegistry

Contract: `0x8004A818BFB912233c491871b3d84c89A494BD9e`
Network: Arc Testnet (Chain ID 5042002)
Standard: [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004)

## Registered Broker Agents

| Broker | Token ID | Wallet | ArcScan |
|--------|----------|--------|---------|
| Guardian | #1448 | `0xea108a5074772f700Dc84c76F180b11285be6d8d` | [View](https://testnet.arcscan.app/address/0xea108a5074772f700Dc84c76F180b11285be6d8d) |
| Sentinel | #1449 | `0x225F28E9c6d4E9a2DB8E2b007BEc91716E331efB` | [View](https://testnet.arcscan.app/address/0x225F28E9c6d4E9a2DB8E2b007BEc91716E331efB) |
| Steady   | #1450 | `0xbe3359304457A8C0C443Ad412E65f7d4aADC405e` | [View](https://testnet.arcscan.app/address/0xbe3359304457A8C0C443Ad412E65f7d4aADC405e) |
| Navigator| #1451 | `0x1eE2cfc2b77D388B451F7Dd74982391e0bB3BaD5` | [View](https://testnet.arcscan.app/address/0x1eE2cfc2b77D388B451F7Dd74982391e0bB3BaD5) |
| Growth   | #1452 | `0xa9624B279640F36aDCAd3845447d40bbe6eb7E5B` | [View](https://testnet.arcscan.app/address/0xa9624B279640F36aDCAd3845447d40bbe6eb7E5B) |
| Momentum | #1453 | `0x92Cd4862E054e3F426818D1883b92A9321Ae6Ba5` | [View](https://testnet.arcscan.app/address/0x92Cd4862E054e3F426818D1883b92A9321Ae6Ba5) |
| Apex     | #1454 | `0x5c10Adf159D45D1A3874882d36cdacA722C000c9` | [View](https://testnet.arcscan.app/address/0x5c10Adf159D45D1A3874882d36cdacA722C000c9) |
| Titan    | #1455 | `0x3004B4add68C3753Ecd5f18edD93EE999Ffaff3e` | [View](https://testnet.arcscan.app/address/0x3004B4add68C3753Ecd5f18edD93EE999Ffaff3e) |

## Registration Transactions

Each broker called `register(metadataURI)` on the IdentityRegistry, minting an ERC-8004 identity NFT.

| Broker | Transaction |
|--------|-------------|
| Guardian | [0xba9f73ea...](https://testnet.arcscan.app/tx/0xba9f73ea04c57178f6a39f049ab04fbdf94f1008c7df65ff8c283464a8ad17c1) |
| Sentinel | [0xe54ce103...](https://testnet.arcscan.app/tx/0xe54ce10364ad4fc1710f1451bcc2ad02c10f22082f2145f772259a8151283b18) |
| Steady   | [0xbf5c7570...](https://testnet.arcscan.app/tx/0xbf5c7570288ca61ed4415b4114a037d98360250e71e3c0b7bd5e1cd5ea7ca761) |
| Navigator| [0xa5b058cb...](https://testnet.arcscan.app/tx/0xa5b058cb372822e4c0a356df196c9d1de3f91743f76f72035551074947d0ec19) |
| Growth   | [0x69a05e18...](https://testnet.arcscan.app/tx/0x69a05e18340e707d52564bd6f9b3e597360e8d6ad45a07ace6379b618b77d452) |
| Momentum | [0x9c0be40f...](https://testnet.arcscan.app/tx/0x9c0be40ffd595f0f0e539e2f85e74113aeb7446c6837c50930bb2263c9b0b47c) |
| Apex     | [0xe39f802e...](https://testnet.arcscan.app/tx/0xe39f802ea6065743ded2fe333188c32740aae8caeb95489b7521df62f17335bd) |
| Titan    | [0x8d8273e3...](https://testnet.arcscan.app/tx/0x8d8273e326e7446ad15a10bd3a0583edc38e41fd1fb9809691bbccd3551664cd) |

## What this means

Each broker agent has:
- **Onchain identity** as an ERC-8004 NFT on Arc Testnet
- **Verifiable wallet address** traceable on ArcScan
- **Metadata URI** pointing to agent capabilities
- **Token ID** for reputation tracking

These identities are separate from Flow Broker's own AgentRegistry — they use Arc's official ERC-8004 standard which is the canonical identity layer for AI agents on Arc.

## Verify on ArcScan

View all registered agents:
https://testnet.arcscan.app/address/0x8004A818BFB912233c491871b3d84c89A494BD9e
