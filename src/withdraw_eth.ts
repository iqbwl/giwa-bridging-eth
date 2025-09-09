// src/withdraw_eth.ts
import {
  publicClientL1,
  publicClientL2,
  walletClientL1,
  walletClientL2,
  account,
} from "./config";
import { parseEther, formatEther } from "viem";

const MIN = 0.001; // ETH
const MAX = 10;    // ETH

function assertAmountBounds(amountStr: string) {
  const n = Number(amountStr);
  if (Number.isNaN(n)) throw new Error(`Invalid amount: ${amountStr}`);
  if (n <= MIN) throw new Error(`Amount must be > ${MIN} ETH per tx`);
  if (n > MAX) throw new Error(`Amount must be ≤ ${MAX} ETH per tx`);
  return amountStr;
}

async function main() {
  // Usage:
  // node --import=tsx src/withdraw_eth.ts <amount>
  // Examples:
  // node --import=tsx src/withdraw_eth.ts 0.02
  // node --import=tsx src/withdraw_eth.ts 1
  const input = process.argv[2] ?? "0.01";
  const amountStr = assertAmountBounds(input);
  const amount = parseEther(amountStr);

  // 1) Check L2 balance
  const l2Bal = await publicClientL2.getBalance({ address: account.address });
  console.log(`L2 Balance: ${formatEther(l2Bal)} ETH`);
  console.log(`Withdraw request: ${amountStr} ETH`);

  if (l2Bal < amount) {
    throw new Error(
      `Insufficient L2 balance. Need ${amountStr} ETH, have ${formatEther(l2Bal)} ETH`
    );
  }

  // 2) Initiate withdrawal on L2
  const withdrawalArgs = await publicClientL1.buildInitiateWithdrawal({
    to: account.address,
    value: amount,
  });

  const l2Hash = await walletClientL2.initiateWithdrawal(withdrawalArgs);
  console.log(`L2 withdrawal tx: ${l2Hash}`);

  const l2Receipt = await publicClientL2.waitForTransactionReceipt({ hash: l2Hash });
  console.log(`L2 status: ${l2Receipt.status}`);

  if (l2Receipt.status !== "success") {
    console.error("Withdrawal reverted on L2. Try reducing the amount and retry.");
    return;
  }

  // 3) Wait until the withdrawal can be proved on L1
  //    (depends on sequencer output interval; can take up to a couple of hours)
  console.log("Waiting until the withdrawal is proveable on L1...");
  const { output, withdrawal } = await publicClientL1.waitToProve({
    receipt: l2Receipt,
    targetChain: walletClientL2.chain,
  });

  // 4) Prove the withdrawal on L1
  const proveArgs = await publicClientL2.buildProveWithdrawal({ output, withdrawal });
  const proveHash = await walletClientL1.proveWithdrawal(proveArgs);
  console.log(`L1 prove tx: ${proveHash}`);

  const proveReceipt = await publicClientL1.waitForTransactionReceipt({ hash: proveHash });
  console.log(`L1 prove status: ${proveReceipt.status}`);
  if (proveReceipt.status !== "success") {
    console.error("Prove step reverted on L1. Retry later.");
    return;
  }

  // 5) Wait for the challenge period to pass, so we can finalize
  console.log("Waiting for the challenge period to elapse (optimistic rollup)...");
  await publicClientL1.waitToFinalize({
    targetChain: walletClientL2.chain,
    withdrawalHash: withdrawal.withdrawalHash,
  });

  // 6) Finalize the withdrawal on L1
  const finalizeHash = await walletClientL1.finalizeWithdrawal({
    targetChain: walletClientL2.chain,
    withdrawal,
  });
  console.log(`L1 finalize tx: ${finalizeHash}`);

  const finalizeReceipt = await publicClientL1.waitForTransactionReceipt({ hash: finalizeHash });
  console.log(`L1 finalize status: ${finalizeReceipt.status}`);

  if (finalizeReceipt.status === "success") {
    console.log("Withdrawal completed successfully!");
  } else {
    console.error("Finalize step failed on L1.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

