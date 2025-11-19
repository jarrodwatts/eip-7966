"use client";

import { useState, useEffect, useRef } from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { RPCCallLog } from "@/lib/instrumented-transport";
import { createBenchmarkClients } from "@/lib/benchmark-clients";
import { runAsyncTransaction, runSyncTransaction, PrefetchOptions } from "@/lib/benchmark-runner";
import { BenchmarkResult } from "@/types/benchmark";
import { ResultCard } from "./ResultCard";
import { ShimmerButton } from "./ui/shimmer-button";
import { PrefetchControlPanel } from "./PrefetchControlPanel";

// Partial result that updates in real-time
interface PartialResult {
  type: "async" | "sync";
  startTime: number;
  rpcCalls: RPCCallLog[];
  isComplete: boolean;
}

export function TransactionBenchmark() {
  const [isRunning, setIsRunning] = useState(false);
  const [asyncResult, setAsyncResult] = useState<BenchmarkResult | null>(null);
  const [syncResult, setSyncResult] = useState<BenchmarkResult | null>(null);
  const [asyncPartial, setAsyncPartial] = useState<PartialResult | null>(null);
  const [syncPartial, setSyncPartial] = useState<PartialResult | null>(null);
  const [asyncElapsed, setAsyncElapsed] = useState(0);
  const [syncElapsed, setSyncElapsed] = useState(0);
  const [prefetchOptions, setPrefetchOptions] = useState<PrefetchOptions>({
    nonce: false,
    gasParams: false,
    chainId: false,
  });
  
  const asyncTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const syncTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const runBenchmark = async () => {
    setIsRunning(true);
    setAsyncResult(null);
    setSyncResult(null);
    setAsyncElapsed(0);
    setSyncElapsed(0);

    // Generate two separate accounts for a fair parallel benchmark
    const asyncAccount = privateKeyToAccount(generatePrivateKey());
    const syncAccount = privateKeyToAccount(generatePrivateKey());

    // Create separate RPC call logs for each transaction type
    const asyncRPCCalls: RPCCallLog[] = [];
    const syncRPCCalls: RPCCallLog[] = [];
    
    const asyncStartTime = Date.now();
    const syncStartTime = Date.now();

    // Initialize partial results
    setAsyncPartial({
      type: "async",
      startTime: asyncStartTime,
      rpcCalls: [],
      isComplete: false,
    });
    setSyncPartial({
      type: "sync",
      startTime: syncStartTime,
      rpcCalls: [],
      isComplete: false,
    });

    // Start timers for elapsed time
    asyncTimerRef.current = setInterval(() => {
      setAsyncElapsed(Date.now() - asyncStartTime);
    }, 50);
    
    syncTimerRef.current = setInterval(() => {
      setSyncElapsed(Date.now() - syncStartTime);
    }, 50);

    // Pre-fetch gas parameters if enabled (before creating transaction clients)
    // Use a temporary client that doesn't log to transaction RPC arrays
    let prefetchedGas = null;
    if (prefetchOptions.gasParams) {
      console.log("⛽ Pre-fetching gas parameters...");
      
      // Create a temporary client just for pre-fetching (doesn't log to RPC arrays)
      const prefetchClients = createBenchmarkClients(
        asyncAccount, 
        () => {}, // Empty logger - don't track these calls
        undefined,
        prefetchOptions.chainId
      );
      
      const [block, maxPriorityFee, gasEstimate] = await Promise.all([
        prefetchClients.publicClient.getBlock({ blockTag: 'latest' }),
        prefetchClients.publicClient.request({ method: 'eth_maxPriorityFeePerGas' }),
        prefetchClients.publicClient.estimateGas({
          account: asyncAccount.address,
          to: "0x0000000000000000000000000000000000000000",
          value: BigInt(0),
        }),
      ]);
      
      prefetchedGas = {
        maxFeePerGas: block.baseFeePerGas ? block.baseFeePerGas + BigInt(maxPriorityFee) : BigInt(maxPriorityFee),
        maxPriorityFeePerGas: BigInt(maxPriorityFee),
        gas: gasEstimate,
      };
      
      console.log("✅ Gas parameters pre-fetched:", prefetchedGas);
    }

    // Create clients for async transaction with its own account
    const asyncClients = createBenchmarkClients(
      asyncAccount, 
      (log) => {
        // When a call completes, find and update the pending entry or add if not found
        const pendingIndex = asyncRPCCalls.findIndex(
          call => call.method === log.method && call.isPending && call.startTime === log.startTime
        );
        if (pendingIndex >= 0) {
          asyncRPCCalls[pendingIndex] = { ...log, isPending: false };
        } else {
          asyncRPCCalls.push({ ...log, isPending: false });
        }
        setAsyncPartial(prev => prev ? { ...prev, rpcCalls: [...asyncRPCCalls] } : null);
      },
      (log) => {
        // When a call starts, add it as pending
        asyncRPCCalls.push({ ...log, endTime: 0, duration: 0, isPending: true });
        setAsyncPartial(prev => prev ? { ...prev, rpcCalls: [...asyncRPCCalls] } : null);
      },
      prefetchOptions.chainId
    );
    
    // Create clients for sync transaction with its own account
    const syncClients = createBenchmarkClients(
      syncAccount, 
      (log) => {
        // When a call completes, find and update the pending entry or add if not found
        const pendingIndex = syncRPCCalls.findIndex(
          call => call.method === log.method && call.isPending && call.startTime === log.startTime
        );
        if (pendingIndex >= 0) {
          syncRPCCalls[pendingIndex] = { ...log, isPending: false };
        } else {
          syncRPCCalls.push({ ...log, isPending: false });
        }
        setSyncPartial(prev => prev ? { ...prev, rpcCalls: [...syncRPCCalls] } : null);
      },
      (log) => {
        // When a call starts, add it as pending
        syncRPCCalls.push({ ...log, endTime: 0, duration: 0, isPending: true });
      setSyncPartial(prev => prev ? { ...prev, rpcCalls: [...syncRPCCalls] } : null);
      },
      prefetchOptions.chainId
    );

    // Get starting nonces for each account (only if pre-fetch is disabled)
    // When prefetch is enabled, we use nonce 0 since these are fresh accounts
    let asyncNonce = 0;
    let syncNonce = 0;
    
    if (!prefetchOptions.nonce) {
      // Fetch nonces from the network
      [asyncNonce, syncNonce] = await Promise.all([
        asyncClients.publicClient.getTransactionCount({
          address: asyncAccount.address,
        }),
        syncClients.publicClient.getTransactionCount({
          address: syncAccount.address,
        }),
      ]);
    }

    // Run both transactions in parallel with no dependencies
    // Track completion time for each individually and stop their timers
    const asyncPromise = runAsyncTransaction(
      { ...asyncClients, account: asyncAccount },
      asyncNonce,
      asyncRPCCalls,
      prefetchOptions,
      prefetchedGas
    ).then(res => {
      const duration = Date.now() - asyncStartTime;
      const finalResult = { ...res, duration };
      // Stop async timer and set result immediately when this transaction completes
      if (asyncTimerRef.current) clearInterval(asyncTimerRef.current);
      setAsyncElapsed(duration);
      setAsyncPartial(null);
      setAsyncResult(finalResult); // Set result immediately!
      return finalResult;
    });

    const syncPromise = runSyncTransaction(
      { ...syncClients, account: syncAccount },
      syncNonce,
      syncRPCCalls,
      prefetchOptions,
      prefetchedGas
    ).then(res => {
      const duration = Date.now() - syncStartTime;
      const finalResult = { ...res, duration };
      // Stop sync timer and set result immediately when this transaction completes
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
      setSyncElapsed(duration);
      setSyncPartial(null);
      setSyncResult(finalResult); // Set result immediately!
      return finalResult;
    });

    // Wait for both to complete
    await Promise.all([asyncPromise, syncPromise]);

    // Both are done, no longer running
    setIsRunning(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col items-center gap-8">
        <PrefetchControlPanel
          options={prefetchOptions}
          onChange={setPrefetchOptions}
          disabled={isRunning}
        />
        
        <div className="grid md:grid-cols-2 gap-6 w-full">
          <ResultCard 
            result={asyncResult} 
            isRunning={isRunning} 
            type="async"
            partialResult={asyncPartial}
            elapsedTime={asyncElapsed}
          />
          <ResultCard 
            result={syncResult} 
            isRunning={isRunning} 
            type="sync"
            partialResult={syncPartial}
            elapsedTime={syncElapsed}
          />
        </div>

        <ShimmerButton
          onClick={runBenchmark}
          disabled={isRunning}
          shimmerColor="#10b981"
          shimmerSize="0.1em"
          shimmerDuration="2s"
          borderRadius="0.75rem"
          background="linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)"
          className="w-full px-8 py-3 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] transition-shadow"
        >
          {isRunning ? "Running Benchmark..." : "Run Benchmark"}
        </ShimmerButton>
      </div>
    </div>
  );
}
