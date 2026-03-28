# Blockchain HomeTask Project

A blockchain implementation with a layered Express backend and a React frontend.

> **For Applicants:** See [INSTRUCTIONS.md](./INSTRUCTIONS.md) for task requirements (2 tasks, 4–6 hours).
> See [SETUP.md](./SETUP.md) for a quick-start guide.

---

## Project Structure

```
hometask-blockchain/
│
├── config/
│   └── index.js                  # Environment config (port, CORS, blockchain settings)
│
├── models/
│   ├── blockchain.js             # Block, Transaction, Blockchain domain classes
│   └── index.js                  # Singleton instance + demo data seeding
│
├── utils/
│   ├── logger.js                 # Levelled logger (error / warn / info / debug)
│   ├── response.js               # Unified sendSuccess / sendCreated / sendError helpers
│   └── validator.js              # isValidAddress, isValidAmount, sanitizers
│
├── middleware/
│   ├── cors.middleware.js        # CORS policy
│   ├── logger.middleware.js      # Morgan HTTP request logger
│   ├── errorHandler.middleware.js# Centralised error handler (must be last)
│   ├── notFound.middleware.js    # 404 handler
│   ├── validateRequest.middleware.js  # validateBody / validateParams factories
│   └── rateLimit.middleware.js   # apiLimiter (100 req/min) + writeLimiter (20 req/min)
│
├── routes/
│   ├── index.js                  # Aggregates all /api sub-routes
│   ├── blockchain.routes.js      # /api/chain
│   ├── transaction.routes.js     # /api/transactions
│   ├── mining.routes.js          # /api/mine
│   ├── balance.routes.js         # /api/balance
│   ├── stats.routes.js           # /api/stats
│   ├── health.routes.js          # /health (no rate limit)
│   └── wallet.routes.js          # NEW — /api/wallets (Task 1)
│
├── controllers/
│   ├── blockchain.controller.js
│   ├── transaction.controller.js  # + persist.save() after addTransaction (Task 2)
│   ├── mining.controller.js       # + persist.save() after mine (Task 2)
│   ├── balance.controller.js
│   ├── stats.controller.js
│   └── wallet.controller.js       # NEW — POST /api/wallets (Task 1)
│
├── services/
│   └── persistence.service.js     # NEW — save / load / clear (Task 2)
│
├── src/                          # React frontend
│   ├── api/
│   │   ├── client.js             # Axios instance with request/response interceptors
│   │   ├── endpoints.js          # All API URL constants
│   │   └── blockchain.api.js     # Typed fetch functions (fetchChain, addTransaction…)
│   ├── hooks/
│   │   ├── useBlockchain.js      # Polls /api/chain + /api/stats, returns state
│   │   └── usePolling.js         # Reusable interval-based polling hook
│   ├── utils/
│   │   ├── formatters.js         # truncateHash, formatTimestamp, formatAmount
│   │   └── helpers.js            # isPositiveNumber, groupTransactionsByBlock, etc.
│   ├── constants/
│   │   └── index.js              # POLL_INTERVAL_MS, DEFAULT_MINER_ADDRESS, enums
│   ├── components/
│   │   ├── BlockchainViewer.js
│   │   ├── TransactionForm.js    # Signs tx client-side before submit (Task 1)
│   │   ├── StatsPanel.js
│   │   ├── Header.js
│   │   ├── Wallet.js             # NEW — generate wallet, display balance (Task 1)
│   │   └── ErrorBoundary.js      # React class error boundary
│   ├── App.js
│   └── index.js
│
├── blockchain.js                 # Backward-compat re-export → models/blockchain.js
├── server.js                     # Entry point — wires middleware, routes, starts server
├── .env.example                  # Template for environment variables
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm

### Install & Configure

```bash
npm install
cp .env.example .env   # then edit .env if you need different ports
```

### Run in Development

```bash
# Terminal 1 — React dev server on http://localhost:3000
npm start

# Terminal 2 — API server on http://localhost:3002, with auto-reload
npm run dev
```

The React app proxies all `/api/*` requests to the API server automatically via `src/setupProxy.js`.

### Run in Production

```bash
npm run serve   # builds the React app, then serves everything from port 3002
```

---

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed.

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `development` or `production` |
| `PORT` | `3002` | API server port |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `BLOCKCHAIN_DIFFICULTY` | `2` | Proof-of-work difficulty |
| `BLOCKCHAIN_MINING_REWARD` | `100` | Coinbase reward per mined block |
| `INITIAL_MINER_ADDRESS` | `genesis-miner` | Address for the first demo block reward |
| `SEED_DEMO_DATA` | `true` | Set to `false` to start with an empty chain |
| `REACT_APP_API_URL` | `http://localhost:3002` | Used by the React app |

---

## API Reference

All API responses share a common envelope:

```json
{ "success": true, ...payload }
{ "success": false, "error": "message" }
```

### Chain

| Method | Path | Description |
|---|---|---|
| GET | `/api/chain` | Full chain + length |
| GET | `/api/chain/valid` | `{ isValid: bool }` |

### Transactions

| Method | Path | Description |
|---|---|---|
| POST | `/api/transactions` | Add a pending transaction |
| GET | `/api/transactions/pending` | All pending transactions |
| GET | `/api/transactions/all` | All confirmed transactions |

**POST `/api/transactions` body:**
```json
{ "fromAddress": "address1", "toAddress": "address2", "amount": 100 }
```

### Mining

| Method | Path | Description |
|---|---|---|
| POST | `/api/mine` | Mine pending transactions into a new block |

**POST `/api/mine` body:**
```json
{ "miningRewardAddress": "miner1" }
```

### Balance

| Method | Path | Description |
|---|---|---|
| GET | `/api/balance/:address` | Confirmed balance of an address |

### Stats

| Method | Path | Description |
|---|---|---|
| GET | `/api/stats` | Chain length, difficulty, validity, pending count |

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Server uptime, env, timestamp — no rate limit |

---

## Frontend Architecture

The React app is organised into distinct concerns:

- **`src/api/`** — all network calls live here. Components never call `fetch`/`axios` directly.
- **`src/hooks/useBlockchain`** — single source of truth for chain + stats state; polls every 5 s.
- **`src/utils/formatters`** — pure formatting functions (hash truncation, timestamps, amounts).
- **`src/constants/`** — magic strings and numbers in one place.
- **`ErrorBoundary`** — catches any unhandled React render errors gracefully.

---

## Technologies

### Backend
- Node.js + Express
- `morgan` — HTTP request logging
- `dotenv` — environment variable loading
- `express-rate-limit` — API rate limiting
- `cors` — CORS policy middleware
- Node.js built-in `crypto` — SHA-256 hashing

### Frontend
- React 18
- Axios (with interceptors)
- CSS3 (glassmorphism, gradients, animations)

---

## Troubleshooting

**Port already in use**
```bash
# Use a different port
PORT=3003 npm run dev
```

**Frontend can't reach the API**
- Confirm `npm run dev` is running on port 3002
- Check `REACT_APP_API_URL` in your `.env`
- Confirm `src/setupProxy.js` target matches `PORT`

**Chain resets on every restart**
- This is expected until you implement Task 2 (Data Persistence) from INSTRUCTIONS.md

---

## Changes

### Task 1 — Cryptographic Wallet System

Replaced plain-string addresses with a real secp256k1 cryptographic wallet system.

#### Backend

| File | What changed |
|---|---|
| `models/blockchain.js` | `Transaction.signTransaction(signingKey)` signs the transaction hash using an **elliptic** secp256k1 key pair. `Transaction.isValid()` fully verifies the DER-encoded signature against the public key (the `return true` bypass is removed). `Blockchain.addTransaction()` now rejects any unsigned transaction via `isValid()`. |
| `controllers/wallet.controller.js` | **New** — `POST /api/wallets` generates a secp256k1 key pair via the `elliptic` library and returns `{ publicKey, privateKey }` as hex strings. CommonJS syntax, follows the existing `routes/ → controllers/` pattern, uses `sendSuccess` / `sendError`. |
| `routes/wallet.routes.js` | **New** — mounts `generateWallet` at `POST /`. |
| `routes/index.js` | Registers `/api/wallets` route. |
| `models/index.js` | Demo-data seeding now uses `elliptic` key pairs (matching `signTransaction`). Transactions are signed before being added to the chain. |

#### Frontend

| File | What changed |
|---|---|
| `src/components/Wallet.js` | Calls `POST /api/wallets`, displays the public key (wallet address) and live balance (polled every 5 s), and stores the private key in local component state only — never sent back to the server. Fixed balance response access to match the axios interceptor unwrapping. |
| `src/components/TransactionForm.js` | Signs transactions client-side with the wallet's private key using **elliptic** secp256k1 + Web Crypto SHA-256, then submits the full signed payload `{ fromAddress, toAddress, amount, timestamp, signature }`. |
| `src/api/blockchain.api.js` | Added `createWallet()` call. |
| `src/api/endpoints.js` | Added `WALLET` endpoint constant. |

#### New API endpoint

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/wallets` | None | Returns `{ publicKey, privateKey }` — both hex strings (secp256k1). |

---

### Task 2 — Blockchain Persistence

Blockchain state (chain + pending transactions) now survives server restarts.

#### New files

| File | Purpose |
|---|---|
| `services/persistence.service.js` | `save(blockchain)` — serialises chain + pending pool to `blockchain.json`. `load()` — deserialises and rehydrates full class instances; returns `null` on any error. `clear()` — deletes the file (useful in tests). All I/O errors are caught; the server never crashes. |

#### Modified files

| File | What changed |
|---|---|
| `models/index.js` | On startup calls `persist.load()`. If a valid saved state is found **and** passes `isChainValid()`, the chain is restored. Otherwise falls back to seeding fresh demo data. |
| `controllers/mining.controller.js` | Calls `persist.save()` after every successful mine. |
| `controllers/transaction.controller.js` | Calls `persist.save()` after every new transaction is added to the pending pool. |
| `.gitignore` | Added `blockchain.json` (persisted state has no place in source control). |

#### Storage format

`blockchain.json` at the project root:

```json
{
  "savedAt": "<ISO-8601 timestamp>",
  "difficulty": 2,
  "miningReward": 100,
  "chain": [ /* Block objects */ ],
  "pendingTransactions": [ /* Transaction objects */ ]
}
```

#### No new environment variables

Persistence is always enabled. To start with a clean chain, delete `blockchain.json` and restart the server.

---

### Known Limitations & Trade-offs

- **IIFE async init in `models/index.js`**: Loading the saved state is async but `require()` is synchronous. The IIFE fires a micro-task that completes before Express starts serving requests in practice, but a cleaner solution would be to make server startup itself async (e.g., call `loadSavedState()` in `server.js` before `app.listen()`). Kept simple to avoid touching `server.js`.
- **Private key returned once**: The `/api/wallets` endpoint returns the private key in plain JSON. In production this should be done over HTTPS only, and the key should ideally never leave the client (generated in-browser). Acceptable for this assessment context.
- **No write queue**: `persist.save()` does not coalesce rapid sequential saves; under very high transaction throughput this could result in many concurrent writes. A debounce or write-lock would be appropriate in a production system.
- **secp256k1 via `elliptic`**: Node.js 15+ supports `secp256k1` natively via `crypto.generateKeyPairSync`. The `elliptic` library is used here for consistency (the frontend also uses it for signing) and broader Node version compatibility.

---

## License

MIT — for learning and assessment purposes.

