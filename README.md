# GIWA Bridging (ETH Sepolia ↔ GIWA Sepolia)

Bridge ETH between **Ethereum Sepolia (L1)** and **GIWA Sepolia (L2)** using [viem](https://viem.sh) and OP Stack–compatible contracts.

This repo contains:

* `src/deposit_eth.ts` — L1 → L2
* `src/withdraw_eth.ts` — L2 → L1

Both scripts accept an **amount** via CLI and enforce **amount > 0.001 ETH** and **amount ≤ 10 ETH** per transaction.

---

## ✅ Requirements

* **Node.js** v18+ (v22 works)
* **pnpm** package manager
* **TypeScript tooling**

  * `tsx` (run TS without compile step)
  * `@types/node` (Node type definitions for VSCode/TS)
* **Libraries**

  * `viem`
  * `dotenv` (to load `.env`)
* **A funded Sepolia testnet wallet** (for gas & value)

> Use testnet-only keys. Never use mainnet keys here.

---

## 🔐 Environment (.env)

Store your private key in a `.env` file at the project root:

```bash
git clone https://github.com/iqbwl/giwa-bridging-eth.git
cd giwa-bridging-eth/
cp .env.example .env
```

```dotenv
# .env
TEST_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

> If you previously exported `TEST_PRIVATE_KEY` in your shell, it can override `.env`. Unset it (`unset TEST_PRIVATE_KEY`) or configure your dotenv loader to override shell envs.

---

## 📦 Installation

```bash
pnpm init
pnpm add -D tsx @types/node
pnpm add viem dotenv
```

Project structure (example):

```
giwa-bridging-eth/
├─ src/
│  ├─ config.ts
│  ├─ deposit_eth.ts
│  └─ withdraw_eth.ts
├─ .env                  # your private key
├─ tsconfig.json
├─ package.json
└─ .gitignore
```

### TypeScript config (VSCode-friendly)

Make sure your `tsconfig.json` includes Node types:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src"]
}
```

If VSCode shows `Cannot find name 'process'`, install Node types and restart the TS server:

```bash
pnpm add -D @types/node
```

---

## 🔧 RPC & Chains

* **L1 (Ethereum Sepolia)** — use your preferred provider (Infura/Alchemy/public RPC).
* **L2 (GIWA Sepolia)** — `https://sepolia-rpc.giwa.io`

`src/config.ts` should configure both chains, bridge contracts, and load `TEST_PRIVATE_KEY` from `.env`.

---

## 💸 Deposit (Sepolia → GIWA)

```bash
node --import=tsx src/deposit_eth.ts <amount>
```

Examples:

```bash
node --import=tsx src/deposit_eth.ts 0.02
node --import=tsx src/deposit_eth.ts 1
```

What the script does:

1. Reads your key from `.env`
2. Sends deposit on L1 and waits for confirmation
3. Tracks the corresponding L2 transaction

⏱ Typical duration: **a few minutes** (sequencer waits for safe L1 finality).

---

## 💵 Withdraw (GIWA → Sepolia)

```bash
node --import=tsx src/withdraw_eth.ts <amount>
```

Examples:

```bash
node --import=tsx src/withdraw_eth.ts 0.02
node --import=tsx src/withdraw_eth.ts 5
```

Withdrawal flow:

1. Initiate on L2
2. Wait for inclusion on L2
3. Wait until provable on L1
4. Prove on L1
5. Wait for the **challenge period**
6. Finalize on L1

⏱ Can take **hours to days** (optimistic rollup security window).

---

## 🧪 Amount Limits

* Scripts enforce **`amount > 0.001`** and **`amount ≤ 10`** ETH per tx.
* Testnets/bridges may impose additional per-tx caps.
  If a transaction **reverts**, lower the amount and retry.

---

## 🧰 Troubleshooting

* **Script still uses old key**
  Check for a shell export:

  ```bash
  printenv | grep TEST_PRIVATE_KEY
  unset TEST_PRIVATE_KEY
  ```

  Then run from the project root (where `.env` resides).

* **VSCode shows `process` not found**
  Install Node types and ensure `tsconfig.json` includes `"types": ["node"]`.
  Restart the TypeScript server in VSCode.

* **Reverted deposit/withdraw**
  Usually a limit/cap or RPC hiccup. Lower the amount, add a short delay between attempts, and verify balances and gas.

---

## 🔒 Security

* Never commit `.env` or private keys.
* Rotate any key exposed in public repos.
* Use separate testnet keys; don’t reuse for mainnet.

---

## 📚 References

* [GIWA docs — Bridging ETH](https://docs.giwa.io/get-started/bridging/eth?utm_source=chatgpt.com)
* [Viem Documentation](https://viem.sh)
* {Optimism OP Stack](https://stack.optimism.io)

---