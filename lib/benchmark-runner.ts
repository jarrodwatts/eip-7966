import { zeroAddress } from "viem";
import { Account } from "viem/accounts";
import { abstractTestnet } from "viem/chains";
import { paymasterConfig } from "@/config/paymaster-config";
import { BenchmarkResult } from "@/types/benchmark";
import { RPCCallLog } from "@/lib/instrumented-transport";

interface TransactionClients {
  walletClient: any; // Extended with eip712WalletActions
  publicClient: any; // Extended with publicActionsL2
}

export interface PrefetchOptions {
  nonce: boolean;
  gasParams: boolean;
  chainId: boolean;
}

export interface PrefetchedGas {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  gas: bigint;
}

export async function runAsyncTransaction(
  clients: TransactionClients & { account: Account },
  nonce: number,
  rpcCalls: RPCCallLog[],
  prefetchOptions: PrefetchOptions,
  prefetchedGas: PrefetchedGas | null = null
): Promise<BenchmarkResult> {
  const startTime = Date.now();
  
  try {
    const txParams: any = {
      to: zeroAddress,
      value: BigInt(0),
      ...paymasterConfig,
    };

    // Add pre-fetched nonce if enabled
    if (prefetchOptions.nonce) {
      txParams.nonce = nonce;
    }

    // Add pre-fetched gas parameters if enabled
    if (prefetchOptions.gasParams && prefetchedGas) {
      console.log("🔧 Async: Using pre-fetched gas params:", prefetchedGas);
      txParams.maxFeePerGas = prefetchedGas.maxFeePerGas;
      txParams.maxPriorityFeePerGas = prefetchedGas.maxPriorityFeePerGas;
      txParams.gas = prefetchedGas.gas;
    }

    let hash: string;
    
    // When all params are prefetched, skip prepareTransactionRequest to avoid re-estimation
    if (prefetchOptions.nonce && prefetchOptions.gasParams && prefetchOptions.chainId && prefetchedGas) {
      console.log("🔧 Async: Skipping prepareTransactionRequest, signing directly");
      // Add account and chain directly since we're skipping prepare
      const requestToSign: any = {
        ...txParams,
        from: clients.account.address,
        chainId: abstractTestnet.id,
      };
      const serializedTransaction = await clients.walletClient.signTransaction(requestToSign);
      hash = await clients.publicClient.sendRawTransaction({ serializedTransaction });
    } else {
      // Use normal flow when some params aren't prefetched
      hash = await clients.walletClient.sendTransaction(txParams);
    }

    await clients.publicClient.waitForTransactionReceipt({ hash });
    const endTime = Date.now();

    return {
      type: "async",
      startTime,
      endTime,
      duration: endTime - startTime,
      txHash: hash,
      status: "success",
      rpcCalls,
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      type: "async",
      startTime,
      endTime,
      duration: endTime - startTime,
      txHash: "",
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      rpcCalls,
    };
  }
}

export async function runSyncTransaction(
  clients: TransactionClients & { account: Account },
  nonce: number,
  rpcCalls: RPCCallLog[],
  prefetchOptions: PrefetchOptions,
  prefetchedGas: PrefetchedGas | null = null
): Promise<BenchmarkResult> {
  const startTime = Date.now();
  
  try {
    const txParams: any = {
      to: zeroAddress,
      value: BigInt(0),
      ...paymasterConfig,
    };

    // Add pre-fetched nonce if enabled
    if (prefetchOptions.nonce) {
      txParams.nonce = nonce;
    }

    // Add pre-fetched gas parameters if enabled
    if (prefetchOptions.gasParams && prefetchedGas) {
      txParams.maxFeePerGas = prefetchedGas.maxFeePerGas;
      txParams.maxPriorityFeePerGas = prefetchedGas.maxPriorityFeePerGas;
      txParams.gas = prefetchedGas.gas;
    }

    // Note: chainId is controlled at transport level (intercepted when prefetch is enabled)

    const request = await clients.walletClient.prepareTransactionRequest(txParams);

    const serializedTransaction = await clients.walletClient.signTransaction(request);
    
    const receipt = await clients.publicClient.sendRawTransactionSync({
      serializedTransaction,
    });

    const endTime = Date.now();

    return {
      type: "sync",
      startTime,
      endTime,
      duration: endTime - startTime,
      txHash: receipt.transactionHash,
      status: "success",
      rpcCalls,
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      type: "sync",
      startTime,
      endTime,
      duration: endTime - startTime,
      txHash: "",
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      rpcCalls,
    };
  }
}
