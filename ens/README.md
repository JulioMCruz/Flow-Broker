# ENS Integration

ENS is the service discovery layer. Agents have ENS subnames with text records that define their endpoint, price, capabilities, and status.

## How we use ENS

1. Registered `perkmesh.eth` on Sepolia
2. Created 10 subnames (search.perkmesh.eth, llm.perkmesh.eth, etc.)
3. Each subname has 4 text records:
   - `com.x402.endpoint` — where to send payment requests
   - `com.x402.price` — price per call in USDC
   - `com.agent.capabilities` — what the agent does
   - `com.agent.status` — active or inactive
4. Workers resolve ENS before paying — real discovery, not hardcoded
5. Change a text record → agents pay the new price within 30 seconds

## ENS resolver

```typescript
import { discoverAgents } from "./ens-resolver";

const agents = await discoverAgents();
// Returns 10 agents with endpoint, price, capabilities, status
// All read from Sepolia ENS text records
```

## Verify

- https://sepolia.app.ens.domains/perkmesh.eth
- 10 subnames, 40 text records total
