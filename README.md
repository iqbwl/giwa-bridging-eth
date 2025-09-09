---

# GIWA Bridging (ETH Sepolia ↔ GIWA Sepolia)

This project contains example scripts to **bridge ETH between Ethereum Sepolia and GIWA Sepolia testnet** using [viem](https://viem.sh) and OP Stack-compatible contracts.

---

## 📦 Requirements

* Node.js v18+ (v22 works as well)
* [pnpm](https://pnpm.io/) package manager
* Ethereum wallet private key with funded Sepolia ETH (via faucet)

Set your private key before running:

```bash
export TEST_PRIVATE_KEY=0x<your_private_key>
```

⚠️ **Do not use a mainnet private key.** These scripts are for testnet only.

---

## 🚀 Installation

```bash
mkdir giwa-bridging-eth
cd giwa-bridging-eth
pnpm init
pnpm add -D tsx @types/node
pnpm add viem
```

Create `src/` folder and place the following scripts inside:

* `config.ts` → chain & client configuration
* `deposit_eth.ts` → deposit ETH from Sepolia to GIWA Sepolia
* `withdraw_eth.ts` → withdraw ETH from GIWA Sepolia back to Sepolia

---

## 🔧 Configuration (`src/config.ts`)

Defines:

* Ethereum Sepolia (L1)
* GIWA Sepolia (L2, chain ID 91342)
* Portal, Bridge, and Dispute contracts
* Wallet clients (L1 and L2)

---

## 💸 Deposit ETH (Sepolia → GIWA Sepolia)

Deposit ETH from L1 (Sepolia) into L2 (GIWA Sepolia):

```bash
node --import=tsx src/deposit_eth.ts <amount>
```

* `<amount>` must be **greater than 0.001 ETH** and **less than or equal to 10 ETH**.
* Examples:

  ```bash
  node --import=tsx src/deposit_eth.ts 0.05
  node --import=tsx src/deposit_eth.ts 1
  ```

The script will:

1. Check Sepolia balance
2. Build and send deposit transaction on L1
3. Wait for L1 confirmation
4. Track corresponding transaction on L2

⏱ Deposits usually take a **few minutes**.

---

## 💵 Withdraw ETH (GIWA Sepolia → Sepolia)

Withdraw ETH back from L2 to L1:

```bash
node --import=tsx src/withdraw_eth.ts <amount>
```

* `<amount>` must be **greater than 0.001 ETH** and **less than or equal to 10 ETH**.
* Examples:

  ```bash
  node --import=tsx src/withdraw_eth.ts 0.02
  node --import=tsx src/withdraw_eth.ts 5
  ```

The withdrawal process:

1. Initiate withdrawal on L2
2. Wait for L2 confirmation
3. Wait until the withdrawal can be **proved** on L1
4. Prove withdrawal on L1
5. Wait for the **challenge period** (optimistic rollup security window)
6. Finalize withdrawal on L1

⏱ Withdrawals can take **hours to days** depending on sequencer interval and challenge period.

---

## ⚠️ Notes

* Designed for **testnet only**.
* If a deposit or withdrawal reverts, try lowering the amount (testnet bridges usually have per-tx caps).
* Make sure you have enough ETH for both **value** and **gas fees**.
* Default RPC endpoints:

  * Ethereum Sepolia: Infura/Alchemy or any public RPC
  * GIWA Sepolia: `https://sepolia-rpc.giwa.io`

---

## 📚 References

* [GIWA Docs – Bridging ETH](https://docs.giwa.io/get-started/bridging/eth)
* [Viem Documentation](https://viem.sh)
* [Optimism OP Stack](https://stack.optimism.io)

---
