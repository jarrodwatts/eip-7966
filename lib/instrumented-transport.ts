import { Transport, http } from "viem";

export interface RPCCallLog {
  method: string;
  startTime: number;
  endTime: number;
  duration: number;
  isPending?: boolean;
}

export function createInstrumentedTransport(
  url: string | undefined,
  onRPCCall: (log: RPCCallLog) => void,
  onRPCStart?: (log: Omit<RPCCallLog, 'endTime' | 'duration'>) => void,
  prefetchChainId: boolean = false,
  cachedChainId?: number
): Transport {
  const baseTransport = http(url);

  return ((params) => {
    const transport = baseTransport(params);

    return {
      ...transport,
      request: async (request) => {
        const startTime = Date.now();
        
        // If chainId is prefetched and this is an eth_chainId call, return cached value
        // Don't log it since no actual RPC call is made
        if (request.method === "eth_chainId" && prefetchChainId && cachedChainId) {
          console.log("✨ Returning cached chainId (no RPC call):", cachedChainId);
          // Return in hex format as viem expects
          return `0x${cachedChainId.toString(16)}` as any;
        }
        
        // Notify that RPC call is starting
        if (onRPCStart) {
          onRPCStart({
            method: request.method,
            startTime,
          });
        }
        
        try {
          const result = await transport.request(request);
          const endTime = Date.now();
          
          onRPCCall({
            method: request.method,
            startTime,
            endTime,
            duration: endTime - startTime,
          });
          
          return result;
        } catch (error) {
          const endTime = Date.now();
          
          onRPCCall({
            method: request.method,
            startTime,
            endTime,
            duration: endTime - startTime,
          });
          
          throw error;
        }
      },
    };
  }) as Transport;
}

