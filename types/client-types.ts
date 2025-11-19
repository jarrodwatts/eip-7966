import { Account } from "viem/accounts";
import { WalletClient, PublicClient } from "viem";
import { Eip712Actions } from "viem/zksync";

/**
 * Type definitions for wallet and public clients used in benchmarking
 */

/**
 * Extended wallet client with EIP-712 support for zkSync transactions
 */
export type ExtendedWalletClient = WalletClient & Eip712Actions;

/**
 * Extended public client with L2-specific actions
 */
export type ExtendedPublicClient = PublicClient & {
  sendRawTransactionSync: (args: { serializedTransaction: `0x${string}` }) => Promise<{
    transactionHash: string;
    [key: string]: unknown;
  }>;
};

/**
 * Transaction clients bundle used for running benchmarks
 */
export interface TransactionClients {
  walletClient: ExtendedWalletClient;
  publicClient: ExtendedPublicClient;
}

/**
 * Transaction clients with account for running specific benchmark
 */
export interface TransactionClientsWithAccount extends TransactionClients {
  account: Account;
}

/**
 * Transaction parameters for sending to the blockchain
 */
export interface TransactionParams {
  to: `0x${string}`;
  value: bigint;
  paymaster?: `0x${string}`;
  paymasterInput?: `0x${string}`;
  nonce?: number;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  gas?: bigint;
}

