"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";

export interface PrefetchOptions {
  nonce: boolean;
  gasParams: boolean;
  chainId: boolean;
}

interface PrefetchControlPanelProps {
  options: PrefetchOptions;
  onChange: (options: PrefetchOptions) => void;
  disabled?: boolean;
}

export function PrefetchControlPanel({ 
  options, 
  onChange, 
  disabled = false 
}: PrefetchControlPanelProps) {
  const handleToggle = (key: keyof PrefetchOptions) => {
    onChange({ ...options, [key]: !options[key] });
  };

  return (
    <div className="w-full p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
      <div className="flex items-center justify-between gap-8">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Pre-fetch Options</h3>
          <div className="group relative">
            <Info className="w-3.5 h-3.5 text-zinc-500 cursor-help hover:text-zinc-400 transition-colors" />
            <div className="absolute left-0 top-6 w-80 p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-10 shadow-xl">
              <p className="mb-2 font-semibold text-white">What is pre-fetching?</p>
              <p className="mb-2">
                Pre-fetching means fetching transaction parameters (nonce, gas prices, chain ID) <span className="text-emerald-400">before</span> sending the transaction.
              </p>
              <p>
                When disabled, these values are fetched <span className="text-red-400">during</span> transaction execution, adding extra RPC calls and latency. Toggle options to see the performance difference!
              </p>
            </div>
          </div>
          <span className="hidden sm:inline text-xs text-zinc-500">Toggle to see latency impact</span>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Nonce Toggle */}
          <div className="flex items-center gap-2">
            <Label 
              htmlFor="nonce-toggle" 
              className="text-xs text-zinc-400 cursor-pointer whitespace-nowrap"
            >
              Nonce
            </Label>
            <Switch 
              id="nonce-toggle"
              checked={options.nonce}
              onCheckedChange={() => handleToggle("nonce")}
              disabled={disabled}
            />
          </div>

          {/* Gas Parameters Toggle */}
          <div className="flex items-center gap-2">
            <Label 
              htmlFor="gas-toggle" 
              className="text-xs text-zinc-400 cursor-pointer whitespace-nowrap"
            >
              Gas Params
            </Label>
            <Switch 
              id="gas-toggle"
              checked={options.gasParams}
              onCheckedChange={() => handleToggle("gasParams")}
              disabled={disabled}
            />
          </div>

          {/* Chain ID Toggle */}
          <div className="flex items-center gap-2">
            <Label 
              htmlFor="chain-toggle" 
              className="text-xs text-zinc-400 cursor-pointer whitespace-nowrap"
            >
              Chain ID
            </Label>
            <Switch 
              id="chain-toggle"
              checked={options.chainId}
              onCheckedChange={() => handleToggle("chainId")}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

