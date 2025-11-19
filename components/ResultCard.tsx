import { BenchmarkResult } from "@/types/benchmark";
import { RPCCallLog } from "@/lib/instrumented-transport";
import { useAnimatedCounter } from "@/hooks/use-animated-counter";

interface PartialResult {
  type: "async" | "sync";
  startTime: number;
  rpcCalls: RPCCallLog[];
  isComplete: boolean;
}

interface ResultCardProps {
  result: BenchmarkResult | null;
  isRunning: boolean;
  type: "async" | "sync";
  partialResult?: PartialResult | null;
  elapsedTime?: number;
}

function truncateHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

// Component for individual RPC call with animated duration
function RPCCallRow({ call, showMockData, isLiveRunning }: { call: RPCCallLog; showMockData: boolean; isLiveRunning: boolean }) {
  const animatedDuration = useAnimatedCounter(call.duration, 100);
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

// Sample data for initial load
const MOCK_ASYNC_CALLS: RPCCallLog[] = [
  { method: "eth_getTransactionCount", startTime: 0, endTime: 473, duration: 473 },
  { method: "eth_getBlockByNumber", startTime: 0, endTime: 239, duration: 239 },
  { method: "eth_maxPriorityFeePerGas", startTime: 0, endTime: 229, duration: 229 },
  { method: "eth_estimateGas", startTime: 0, endTime: 340, duration: 340 },
  { method: "eth_chainId", startTime: 0, endTime: 228, duration: 228 },
  { method: "eth_chainId", startTime: 0, endTime: 233, duration: 233 },
  { method: "eth_sendRawTransaction", startTime: 0, endTime: 265, duration: 265 },
  { method: "eth_getTransactionReceipt", startTime: 0, endTime: 236, duration: 236 },
  { method: "eth_blockNumber", startTime: 0, endTime: 231, duration: 231 },
  { method: "eth_getTransactionByHash", startTime: 0, endTime: 233, duration: 233 },
  { method: "eth_getTransactionReceipt", startTime: 0, endTime: 233, duration: 233 },
];

const MOCK_SYNC_CALLS: RPCCallLog[] = [
  { method: "eth_getTransactionCount", startTime: 0, endTime: 476, duration: 476 },
  { method: "eth_chainId", startTime: 0, endTime: 233, duration: 233 },
  { method: "eth_getBlockByNumber", startTime: 0, endTime: 231, duration: 231 },
  { method: "eth_maxPriorityFeePerGas", startTime: 0, endTime: 231, duration: 231 },
  { method: "eth_estimateGas", startTime: 0, endTime: 341, duration: 341 },
  { method: "eth_chainId", startTime: 0, endTime: 229, duration: 229 },
  { method: "eth_sendRawTransactionSync", startTime: 0, endTime: 470, duration: 470 },
];

export function ResultCard({ result, isRunning, type, partialResult, elapsedTime = 0 }: ResultCardProps) {
  const isAsync = type === "async";
  const title = isAsync ? "Async Transaction" : "Sync Transaction (EIP-7966)";
  const subtitle = isAsync 
    ? "sendTransaction + waitForTransactionReceipt" 
    : "sendRawTransactionSync";

  // Determine what to display
  const isLiveRunning = isRunning && partialResult;
  const displayCalls = result?.rpcCalls || partialResult?.rpcCalls || (isAsync ? MOCK_ASYNC_CALLS : MOCK_SYNC_CALLS);
  const totalDuration = displayCalls.reduce((sum, call) => sum + call.duration, 0);
  const showMockData = !result && !isRunning && !partialResult;
  const displayElapsedTime = isLiveRunning ? elapsedTime : result?.duration;
  
  // Use animated counter for the total duration and RPC time
  const animatedDuration = useAnimatedCounter(displayElapsedTime || 0, 100);
  const animatedTotalRPCTime = useAnimatedCounter(totalDuration, 100);

  return (
    <div className={`flex flex-col min-h-[600px] p-6 bg-zinc-900/50 border border-zinc-800 rounded-lg transition-all duration-500 ${
      showMockData ? 'animate-fade-in' : ''
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
          <p className="text-sm text-zinc-400 font-mono">{subtitle}</p>
        </div>
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

      {/* Show mock data, real results, or live running data */}
      {(result || showMockData || isLiveRunning) && (
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

              {/* Total RPC Time - always at bottom */}
              <div className="pt-3 pb-3 border-t border-zinc-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Total RPC Time</span>
                  <span className={`font-mono font-semibold ${showMockData ? 'text-zinc-500' : isLiveRunning ? 'text-yellow-400' : 'text-emerald-400'}`}>
                    {showMockData ? '--' : animatedTotalRPCTime}ms
                  </span>
                </div>
              </div>

              {/* Transaction Hash - always at bottom */}
              {!showMockData && result && (
                <div className="pt-3 border-t border-zinc-700 flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Transaction Hash</span>
                  <a
                    href={`https://sepolia.abscan.org/tx/${result.txHash}`}
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

