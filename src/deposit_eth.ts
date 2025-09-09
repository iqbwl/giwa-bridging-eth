// src/deposit_eth.ts
import { publicClientL1, publicClientL2, walletClientL1, account } from "./config";
import { parseEther, formatEther } from "viem";
import { getL2TransactionHashes } from "viem/op-stack";

const MIN = 0.001; // ETH
const MAX = 10;    // ETH

function assertAmountBounds(amountStr: string) {
  const n = Number(amountStr);
  if (Number.isNaN(n)) throw new Error(`Jumlah tidak valid: ${amountStr}`);
  if (n <= MIN) throw new Error(`Jumlah harus > ${MIN} ETH per tx`);
  if (n > MAX) throw new Error(`Jumlah maksimal ${MAX} ETH per tx`);
  return amountStr;
}

async function main() {
  // pakai: node --import=tsx src/deposit_eth.ts <amount>
  const input = process.argv[2] ?? "0.01";
  const amountStr = assertAmountBounds(input);
  const amount = parseEther(amountStr);

  const l1Bal = await publicClientL1.getBalance({ address: account.address });
  console.log(`L1 Balance: ${formatEther(l1Bal)} ETH`);
  console.log(`Deposit: ${amountStr} ETH`);

  const depositArgs = await publicClientL2.buildDepositTransaction({
    mint: amount,
    to: account.address,
  });

  const l1Hash = await walletClientL1.depositTransaction(depositArgs);
  console.log(`L1 tx: ${l1Hash}`);

  const l1Receipt = await publicClientL1.waitForTransactionReceipt({ hash: l1Hash });
  console.log(`L1 status: ${l1Receipt.status}`);

  if (l1Receipt.status !== "success") {
    console.error(`Deposit reverted di L1. Coba kurangi jumlah (>${MIN} & ≤${MAX}).`);
    return;
  }

  const [l2Hash] = getL2TransactionHashes(l1Receipt);
  if (!l2Hash) {
    console.error("Tidak menemukan L2 hash di receipt. Menunggu sequencer/bridge? Coba lagi nanti.");
    return;
  }
  console.log(`L2 tx: ${l2Hash}`);

  const l2Receipt = await publicClientL2.waitForTransactionReceipt({ hash: l2Hash });
  console.log(`L2 status: ${l2Receipt.status}`);

  if (l2Receipt.status === "success") {
    console.log("Deposit completed successfully!");
  } else {
    console.error("Deposit di L2 tidak sukses.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

