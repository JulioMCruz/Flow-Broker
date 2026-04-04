# Dashboard

Next.js app that shows the agent economy in real-time.

## Features

- Live payment feed with worker names and clickable addresses
- Stats panel (payments, volume, rate, gas saved)
- Agent list with ENS prices (auto-refreshed)
- Settlement tab showing Gateway batch balance
- ENS tab to change agent prices live
- CRE tab showing workflow execution results
- Contract addresses with ArcScan links
- Search/filter payments by worker or service

## Run

```bash
cd app
npm install
cp .env.example .env.local
npm run dev
```

## Environment

```
NEXT_PUBLIC_WS_URL=wss://api.perkmesh.perkos.xyz/ws
NEXT_PUBLIC_BACKEND_URL=https://api.perkmesh.perkos.xyz
```

## Deploy to Netlify

```bash
npm run build
# Upload out/ folder to Netlify
# Add _redirects for API proxy:
# /api/*  https://api.perkmesh.perkos.xyz/:splat  200
```

## Live

https://perkmesh.netlify.app
