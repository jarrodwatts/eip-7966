/**
 * Utility functions for formatting data displayed in the UI
 */

/**
 * Truncates an Ethereum transaction hash for display
 * @param hash - The full transaction hash
 * @returns Truncated hash in format "0x1234...5678"
 */
export function truncateHash(hash: string): string {
  if (!hash || hash.length < 10) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

/**
 * Formats a duration in milliseconds for display
 * @param ms - Duration in milliseconds
 * @returns Formatted string with "ms" suffix
 */
export function formatDuration(ms: number): string {
  return `${ms}ms`;
}

/**
 * Formats a number with comma separators
 * @param num - Number to format
 * @returns Formatted string with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

