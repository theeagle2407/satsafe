# SatSafe — Private Bitcoin Savings Vault on Starknet

> Save privately. Earn silently. Own completely.

SatSafe is a privacy-first savings vault on Starknet that lets users create locked savings goals, deposit STRK tokens, and track real STARK proof verification status for every transaction.

---

## Key Features

- **Private Savings Vaults** — Create named savings goals with lock periods (1 month to 1 year)
- **Real STRK Transactions** — Every vault deposit is a real on-chain transaction on Starknet Sepolia testnet
- **STARK Proof Tracking** — Live verification status for every transaction (Executed → Proved on L2 → Proved on L1)
- **Add Funds** — Top up any existing vault at any time
- **ZK-Shielded Balances** — Balances are hidden by default and only revealed on request
- **Wallet Support** — ArgentX, Braavos, and OKX wallets

---

## How Privacy Is Improved

Starknet is a ZK-rollup — every transaction submitted on Starknet is verified by a STARK proof before being settled on Ethereum L1. This means:

- Transactions are proven mathematically without revealing private state
- No trusted third party is needed to verify correctness
- Every SatSafe vault deposit goes through Starknet's STARK prover pipeline: `EXECUTED → ACCEPTED_ON_L2 (STARK proof generated) → ACCEPTED_ON_L1 (settled on Ethereum)`

SatSafe surfaces this proof pipeline in real time on every vault card, showing users exactly where their transaction sits in the ZK verification process.

---

## Architecture

```
User → Connect Starknet Wallet (ArgentX / Braavos / OKX)
     → Create Vault (name + amount + lock period)
     → STRK transfer transaction sent to Starknet Sepolia
     → Transaction hash stored in localStorage per wallet address
     → /api/proof fetches live STARK proof status from Starknet RPC
     → /api/balance fetches live STRK balance from Starknet RPC
     → Vault balances and proof status displayed in real time
```

---

## Dependencies

- Next.js 15
- TypeScript
- Tailwind CSS
- starknet
- @starknet-react/core
- @starknet-react/chains
- @tanstack/react-query
- wagmi
- viem
- lucide-react

---

## Running the Project

### Prerequisites
- Node.js 18+
- ArgentX, Braavos, or OKX wallet browser extension
- Starknet Sepolia testnet STRK tokens (free from faucet.starknet.io)

### Setup

```bash
git clone https://github.com/theeagle2407/satsafe.git
cd satsafe
npm install --legacy-peer-deps
npm run dev
```

Open http://localhost:3000

### Environment Variables

No environment variables required. All RPC calls use public Starknet Sepolia endpoints.

---

## Team

Built for **PL Genesis Hackathon 2026** — Starknet Bounty Track

| Name | Role |
|------|------|
| [Eagle] | Full Stack Developer |

---

## License

MIT