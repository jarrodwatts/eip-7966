import { zeroAddress } from "viem";
import { abstractTestnet } from "viem/chains";
import { paymasterConfig } from "@/config/paymaster-config";
import { BenchmarkResult } from "@/types/benchmark";
import { RPCCallLog } from "@/lib/instrumented-transport";
import { TransactionClientsWithAccount, TransactionParams } from "@/types/client-types";

/**
 * Configuration for pre-fetching transaction parameters
 */
export interface PrefetchOptions {
  /** Whether to pre-fetch the nonce */
  nonce: boolean;
  /** Whether to pre-fetch gas parameters (maxFeePerGas, maxPriorityFeePerGas, gas) */
  gasParams: boolean;
  /** Whether to pre-fetch the chain ID */
  chainId: boolean;
}

/**
 * Pre-fetched gas parameters for transactions
 */
export interface PrefetchedGas {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  gas: bigint;
}

/**
 * Runs an async transaction benchmark using the traditional approach:
 * sendTransaction followed by waitForTransactionReceipt
 * 
 * @param clients - Wallet and public clients with account
 * @param nonce - Starting nonce for the transaction
 * @param rpcCalls - Array to collect RPC call logs
 * @param prefetchOptions - Configuration for which parameters to pre-fetch
 * @param prefetchedGas - Pre-fetched gas parameters if available
 * @returns Benchmark result with timing and RPC call data
 */
export async function runAsyncTransaction(
  clients: TransactionClientsWithAccount,
  nonce: number,
  rpcCalls: RPCCallLog[],
  prefetchOptions: PrefetchOptions,
  prefetchedGas: PrefetchedGas | null = null
): Promise<BenchmarkResult> {
  const startTime = Date.now();
  console.log("⏱️  [ASYNC] Transaction started at:", startTime);
  
  try {
    const paramsStartTime = Date.now();
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
    const paramsEndTime = Date.now();
    console.log("⏱️  [ASYNC] Params prepared in:", paramsEndTime - paramsStartTime, "ms");

    let hash: string;
    
    // When all params are prefetched, skip prepareTransactionRequest to avoid re-estimation
    if (prefetchOptions.nonce && prefetchOptions.gasParams && prefetchOptions.chainId && prefetchedGas) {
      const requestStartTime = Date.now();
      // Add account and chain directly since we're skipping prepare
      const requestToSign = {
        ...txParams,
        from: clients.account.address,
        chainId: abstractTestnet.id,
      };
      const requestEndTime = Date.now();
      console.log("⏱️  [ASYNC] Request prepared in:", requestEndTime - requestStartTime, "ms");
      
      const signStartTime = Date.now();
      const serializedTransaction = await clients.walletClient.signTransaction(requestToSign);
      const signEndTime = Date.now();
      console.log("⏱️  [ASYNC] Transaction signed in:", signEndTime - signStartTime, "ms");
      
      const sendStartTime = Date.now();
      hash = await clients.publicClient.sendRawTransaction({ serializedTransaction });
      const sendEndTime = Date.now();
      console.log("⏱️  [ASYNC] sendRawTransaction completed in:", sendEndTime - sendStartTime, "ms");
      console.log("⏱️  [ASYNC] Transaction hash:", hash);
    } else {
      // Use normal flow when some params aren't prefetched
      const sendTxStartTime = Date.now();
      hash = await clients.walletClient.sendTransaction(txParams);
      const sendTxEndTime = Date.now();
      console.log("⏱️  [ASYNC] sendTransaction completed in:", sendTxEndTime - sendTxStartTime, "ms");
      console.log("⏱️  [ASYNC] Transaction hash:", hash);
    }

    const waitStartTime = Date.now();
    await clients.publicClient.waitForTransactionReceipt({ hash });
    const waitEndTime = Date.now();
    console.log("⏱️  [ASYNC] waitForTransactionReceipt completed in:", waitEndTime - waitStartTime, "ms");
    
    const endTime = Date.now();
    console.log("⏱️  [ASYNC] Total transaction time:", endTime - startTime, "ms");

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

/**
 * Runs a synchronous transaction benchmark using EIP-7966:
 * sendRawTransactionSync which waits for transaction inclusion before returning
 * 
 * @param clients - Wallet and public clients with account
 * @param nonce - Starting nonce for the transaction
 * @param rpcCalls - Array to collect RPC call logs
 * @param prefetchOptions - Configuration for which parameters to pre-fetch
 * @param prefetchedGas - Pre-fetched gas parameters if available
 * @returns Benchmark result with timing and RPC call data
 */
export async function runSyncTransaction(
  clients: TransactionClientsWithAccount,
  nonce: number,
  rpcCalls: RPCCallLog[],
  prefetchOptions: PrefetchOptions,
  prefetchedGas: PrefetchedGas | null = null
): Promise<BenchmarkResult> {
  const startTime = Date.now();
  console.log("⏱️  [SYNC] Transaction started at:", startTime);
  
  try {
    const paramsStartTime = Date.now();
    const txParams: TransactionParams = {
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
    const paramsEndTime = Date.now();
    console.log("⏱️  [SYNC] Params prepared in:", paramsEndTime - paramsStartTime, "ms");

    // Note: chainId is controlled at transport level (intercepted when prefetch is enabled)

    const prepareStartTime = Date.now();
    const request = await clients.walletClient.prepareTransactionRequest(txParams);
    const prepareEndTime = Date.now();
    console.log("⏱️  [SYNC] prepareTransactionRequest completed in:", prepareEndTime - prepareStartTime, "ms");

    const signStartTime = Date.now();
    const serializedTransaction = await clients.walletClient.signTransaction(request);
    const signEndTime = Date.now();
    console.log("⏱️  [SYNC] Transaction signed in:", signEndTime - signStartTime, "ms");
    
    const sendStartTime = Date.now();
    const receipt = await clients.publicClient.sendRawTransactionSync({
      serializedTransaction,
    });
    const sendEndTime = Date.now();
    console.log("⏱️  [SYNC] sendRawTransactionSync completed in:", sendEndTime - sendStartTime, "ms");
    console.log("⏱️  [SYNC] Transaction hash:", receipt.transactionHash);

    const endTime = Date.now();
    console.log("⏱️  [SYNC] Total transaction time:", endTime - startTime, "ms");

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
