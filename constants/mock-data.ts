import { RPCCallLog } from "@/lib/instrumented-transport";

/**
 * Mock RPC call data for displaying before the first benchmark run
 * These represent typical call patterns for each transaction type
 */

export const MOCK_ASYNC_CALLS: RPCCallLog[] = [
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

export const MOCK_SYNC_CALLS: RPCCallLog[] = [
  { method: "eth_getTransactionCount", startTime: 0, endTime: 476, duration: 476 },
  { method: "eth_chainId", startTime: 0, endTime: 233, duration: 233 },
  { method: "eth_getBlockByNumber", startTime: 0, endTime: 231, duration: 231 },
  { method: "eth_maxPriorityFeePerGas", startTime: 0, endTime: 231, duration: 231 },
  { method: "eth_estimateGas", startTime: 0, endTime: 341, duration: 341 },
  { method: "eth_chainId", startTime: 0, endTime: 229, duration: 229 },
  { method: "eth_sendRawTransactionSync", startTime: 0, endTime: 470, duration: 470 },
];

