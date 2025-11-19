/**
 * Application-wide configuration constants
 */

export const APP_CONFIG = {
  /**
   * URL for the block explorer to view transactions
   */
  BLOCK_EXPLORER_URL: "https://sepolia.abscan.org",
  
  /**
   * Interval for updating elapsed time during benchmark (ms)
   */
  TIMER_UPDATE_INTERVAL: 50,
  
  /**
   * Duration for animated counter transitions (ms)
   */
  COUNTER_ANIMATION_DURATION: 100,
} as const;

export const APP_METADATA = {
  title: "EIP-7966 Synchronous Transactions",
  description: "A demo of the eth_sendRawTransactionSync Method on Abstract",
  appName: "EIP-7966 Demo",
} as const;

