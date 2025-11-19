import { BenchmarkResult } from "@/types/benchmark";
import { truncateHash } from "@/lib/format-utils";
import { APP_CONFIG } from "@/constants/app-config";

interface ComparisonCardProps {
  asyncResult: BenchmarkResult;
  syncResult: BenchmarkResult;
}

export function ComparisonCard({ asyncResult, syncResult }: ComparisonCardProps) {
  const winner = syncResult.duration < asyncResult.duration ? "Sync (EIP-7966)" : "Async";
  const timeDifference = Math.abs(asyncResult.duration - syncResult.duration);

  return (
    <div className="w-full p-6 bg-zinc-900/50 border border-zinc-800 rounded-lg">
      <h3 className="text-xl font-semibold text-white mb-4">Comparison</h3>
      
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4 text-zinc-300">
          <div>
            <p className="text-sm text-zinc-400 mb-1">Async Total Duration</p>
            <p className="font-mono text-2xl text-emerald-400">{asyncResult.duration}ms</p>
            <p className="text-xs text-zinc-500 mt-1">
              {asyncResult.rpcCalls.length} RPC calls
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-400 mb-1">Sync Total Duration</p>
            <p className="font-mono text-2xl text-emerald-400">{syncResult.duration}ms</p>
            <p className="text-xs text-zinc-500 mt-1">
              {syncResult.rpcCalls.length} RPC calls
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-700">
          <p className="text-lg font-semibold text-white mb-2">
            Winner: <span className="text-emerald-400">{winner}</span> by {timeDifference}ms
          </p>
          
          <div className="mt-4 space-y-2">
            <p className="text-sm text-zinc-400">Key Differences:</p>
            <div className="grid md:grid-cols-2 gap-2 text-xs">
              <div className="bg-zinc-800/50 p-2 rounded">
                <p className="text-zinc-300 mb-1">Async: Separate send + wait</p>
                <p className="text-zinc-500">
                  eth_sendRawTransaction → eth_getTransactionReceipt (polling)
                </p>
              </div>
              <div className="bg-zinc-800/50 p-2 rounded">
                <p className="text-zinc-300 mb-1">Sync: Single call</p>
                <p className="text-zinc-500">
                  eth_sendRawTransactionSync (waits for inclusion)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-700">
          <p className="text-sm text-zinc-400 mb-3">Transaction Hashes:</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Async Transaction</span>
              <a
                href={`${APP_CONFIG.BLOCK_EXPLORER_URL}/tx/${asyncResult.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-white hover:text-emerald-300 font-mono transition-colors group"
              >
                <span>{truncateHash(asyncResult.txHash)}</span>
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
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Sync Transaction</span>
              <a
                href={`${APP_CONFIG.BLOCK_EXPLORER_URL}/tx/${syncResult.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-white hover:text-emerald-300 font-mono transition-colors group"
              >
                <span>{truncateHash(syncResult.txHash)}</span>
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
          </div>
        </div>
      </div>
    </div>
  );
}

