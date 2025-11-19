import { RPCCallLog } from "@/lib/instrumented-transport";

/**
 * Represents a partial result during real-time benchmark execution
 * Used to display live updates while transactions are in progress
 */
export interface PartialResult {
  type: "async" | "sync";
  startTime: number;
  rpcCalls: RPCCallLog[];
  isComplete: boolean;
}

