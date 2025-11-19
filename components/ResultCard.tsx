import { BenchmarkResult } from "@/types/benchmark";
import { PartialResult } from "@/types/partial-result";
import { RPCCallLog } from "@/lib/instrumented-transport";
import { useAnimatedCounter } from "@/hooks/use-animated-counter";
import { truncateHash } from "@/lib/format-utils";
import { MOCK_ASYNC_CALLS, MOCK_SYNC_CALLS } from "@/constants/mock-data";
import { APP_CONFIG } from "@/constants/app-config";

interface ResultCardProps {
  result: BenchmarkResult | null;
  isRunning: boolean;
  isPreparing?: boolean;
  type: "async" | "sync";
  partialResult?: PartialResult | null;
  elapsedTime?: number;
}

/**
 * Component for displaying an individual RPC call with animated duration
 */
function RPCCallRow({ 
  call, 
  showMockData, 
  isLiveRunning 
}: { 
  call: RPCCallLog; 
  showMockData: boolean; 
  isLiveRunning: boolean;
}) {
  const animatedDuration = useAnimatedCounter(call.duration, APP_CONFIG.COUNTER_ANIMATION_DURATION);
  const isSyncMethod = call.method === "eth_sendRawTransactionSync";
  const isPending = call.isPending === true;
  
  return (
    <div
      className={`flex items-center justify-between text-xs rounded px-2 py-1 transition-all duration-300 min-h-[24px] border ${
        showMockData 
          ? 'bg-zinc-800/30 border-transparent' 
          : isPending
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : isSyncMethod
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : isLiveRunning
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-zinc-800/50 border-transparent'
      }`}
    >
      <span className={`font-mono transition-colors duration-300 ${showMockData ? 'text-zinc-400' : isPending ? 'text-yellow-300' : isLiveRunning ? 'text-zinc-300' : 'text-zinc-300'}`}>
        {call.method}
      </span>
      <span className={`font-mono transition-colors duration-300 text-right min-w-[50px] inline-block ${
        showMockData 
          ? 'text-zinc-500' 
          : isPending
            ? 'text-yellow-400 animate-pulse'
            : isSyncMethod
              ? 'text-emerald-300 font-semibold'
              : isLiveRunning
                ? 'text-emerald-400'
                : 'text-emerald-400'
      }`}>
        {showMockData ? '--' : isPending ? '...' : `${animatedDuration}ms`}
      </span>
    </div>
  );
}

export function ResultCard({ 
  result, 
  isRunning, 
  isPreparing = false, 
  type, 
  partialResult, 
  elapsedTime = 0 
}: ResultCardProps) {
  const isAsync = type === "async";
  const title = isAsync ? "Async Transaction" : "Sync Transaction (EIP-7966)";
  const subtitle = isAsync 
    ? "sendTransaction + waitForTransactionReceipt" 
    : "sendRawTransactionSync";

  // Determine what to display
  const isLiveRunning = isRunning && partialResult;
  const displayCalls = result?.rpcCalls || partialResult?.rpcCalls || (isAsync ? MOCK_ASYNC_CALLS : MOCK_SYNC_CALLS);
  const totalDuration = displayCalls.reduce((sum, call) => sum + call.duration, 0);
  const showMockData = !result && !isRunning && !partialResult && !isPreparing;
  const displayElapsedTime = isLiveRunning ? elapsedTime : result?.duration;
  
  // Use animated counter for the total duration and RPC time
  const animatedDuration = useAnimatedCounter(displayElapsedTime || 0, APP_CONFIG.COUNTER_ANIMATION_DURATION);
  const animatedTotalRPCTime = useAnimatedCounter(totalDuration, APP_CONFIG.COUNTER_ANIMATION_DURATION);

  return (
    <div className={`flex flex-col min-h-[600px] p-6 bg-zinc-900/50 border border-zinc-800 rounded-lg transition-all duration-500 ${
      showMockData ? 'animate-fade-in' : ''
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
          <p className="text-sm text-zinc-400 font-mono">{subtitle}</p>
        </div>
        {isPreparing && (
          <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-500/20 text-blue-400 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
            Preparing...
          </span>
        )}
        {result && (
          <span
            className={`px-2 py-1 rounded text-xs font-semibold ${
              result.status === "success"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {result.status === "success" ? "✓ Success" : "✗ Error"}
          </span>
        )}
        {isLiveRunning && (
          <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-500/20 text-yellow-400 flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            Live
          </span>
        )}
      </div>

      {/* Show preparing state */}
      {isPreparing && (
        <>
          <div className="mb-3">
            <p className="text-sm text-zinc-400 mb-1">Total Duration</p>
            <p className="text-2xl font-bold font-mono text-blue-400">
              <span className="animate-pulse">--</span>
            </p>
          </div>

          <div className="flex-1 flex flex-col mb-3">
            <p className="text-sm text-zinc-400 mb-2">RPC Call Breakdown</p>
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-blue-400 font-medium animate-pulse">
                Setting up wallets and fetching parameters...
              </p>
            </div>
          </div>
        </>
      )}

      {/* Show mock data, real results, or live running data */}
      {!isPreparing && (result || showMockData || isLiveRunning) && (
        <>
          {(showMockData || result?.status === "success" || isLiveRunning) ? (
            <>
              <div className="mb-3">
                <p className="text-sm text-zinc-400 mb-1">Total Duration</p>
                <p className={`text-2xl font-bold font-mono ${showMockData ? 'text-zinc-400' : isLiveRunning ? 'text-yellow-400' : 'text-emerald-400'}`}>
                  {showMockData ? '--' : animatedDuration}ms
                </p>
              </div>

              <div className="flex-1 flex flex-col mb-3">
                <p className="text-sm text-zinc-400 mb-2">RPC Call Breakdown</p>
                <div className="space-y-1 overflow-y-auto">
                  {displayCalls.map((call, index) => (
                    <RPCCallRow 
                      key={`${call.method}-${index}`} 
                      call={call} 
                      showMockData={showMockData}
                      isLiveRunning={!!isLiveRunning}
                    />
                  ))}
                </div>
              </div>

              {/* Transaction Hash - always at bottom */}
              {!showMockData && result && (
                <div className="pt-3 border-t border-zinc-700 flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Transaction Hash</span>
                  <a
                    href={`${APP_CONFIG.BLOCK_EXPLORER_URL}/tx/${result.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-white hover:text-emerald-300 font-mono transition-colors group"
                  >
                    <span>{truncateHash(result.txHash)}</span>
                    <svg
                      className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              )}
            </>
          ) : result?.status === "error" ? (
            <div>
              <p className="text-sm text-zinc-400 mb-1">Error</p>
              <p className="text-sm text-red-400 wrap-break-word">{result.error}</p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

