# ENS Integration

Flow Broker uses flowbroker.eth as the agent service mesh.

18 subnames: 8 broker agents + 10 information providers.

Each provider has text records:
- com.x402.price — price per call (variable)
- com.agent.capabilities — what it offers
- com.agent.type — provider or broker
- com.agent.status — active/inactive

Brokers discover providers via ENS before each call. Change a text record → agents pay new price within 30s.

ENS: https://sepolia.app.ens.domains/flowbroker.eth
