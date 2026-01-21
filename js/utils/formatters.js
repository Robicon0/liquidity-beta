/**
 * Formatting Utilities
 * Currency, number, date, and address formatting
 */

import { APP_CONFIG } from '../config/constants.js';

/**
 * Format currency value
 * @param {number} value - Value to format
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted currency
 */
export function formatCurrency(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0.00';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: APP_CONFIG.display.currencyCode,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format number with abbreviations (K, M, B)
 * @param {number} value - Value to format
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted number
 */
export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  const absValue = Math.abs(value);

  if (absValue >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(decimals) + 'B';
  } else if (absValue >= 1_000_000) {
    return (value / 1_000_000).toFixed(decimals) + 'M';
  } else if (absValue >= 1_000) {
    return (value / 1_000).toFixed(decimals) + 'K';
  }

  return value.toFixed(decimals);
}

/**
 * Format token amount
 * @param {number} value - Token amount
 * @param {number} decimals - Decimal places
 * @param {string} symbol - Token symbol (optional)
 * @returns {string} Formatted token amount
 */
export function formatTokenAmount(value, decimals = 4, symbol = '') {
  if (value === null || value === undefined || isNaN(value)) {
    return `0 ${symbol}`.trim();
  }

  const formatted = formatNumber(value, decimals);
  return symbol ? `${formatted} ${symbol}` : formatted;
}

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @param {number} decimals - Decimal places
 * @param {boolean} showSign - Show + for positive values
 * @returns {string} Formatted percentage
 */
export function formatPercent(value, decimals = 2, showSign = true) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%';
  }

  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format address (shorten)
 * @param {string} address - Ethereum address
 * @param {number} startChars - Characters to show at start
 * @param {number} endChars - Characters to show at end
 * @returns {string} Shortened address
 */
export function formatAddress(address, startChars = 6, endChars = 4) {
  if (!address) return '—';

  if (address.length <= startChars + endChars) {
    return address;
  }

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format timestamp to date
 * @param {number} timestamp - Unix timestamp (seconds)
 * @param {boolean} includeTime - Include time
 * @returns {string} Formatted date
 */
export function formatDate(timestamp, includeTime = false) {
  if (!timestamp) return '—';

  const date = new Date(timestamp * 1000);

  if (includeTime) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

/**
 * Format relative time (e.g., "2 days ago")
 * @param {number} timestamp - Unix timestamp (seconds)
 * @returns {string} Relative time
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return '—';

  const now = Date.now();
  const then = timestamp * 1000;
  const diffMs = now - then;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 30) {
    return `${diffDays}d ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths}mo ago`;
  } else {
    return `${diffYears}y ago`;
  }
}

/**
 * Format duration
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '—';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Format gas price
 * @param {number} gwei - Gas price in Gwei
 * @returns {string} Formatted gas price
 */
export function formatGasPrice(gwei) {
  if (gwei === null || gwei === undefined || isNaN(gwei)) {
    return '— Gwei';
  }

  return `${gwei.toFixed(2)} Gwei`;
}

/**
 * Format transaction hash
 * @param {string} hash - Transaction hash
 * @returns {string} Shortened hash
 */
export function formatTxHash(hash) {
  return formatAddress(hash, 8, 6);
}

/**
 * Get change indicator class
 * @param {number} value - Value to check
 * @returns {string} CSS class name
 */
export function getChangeClass(value) {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
}

/**
 * Get change icon
 * @param {number} value - Value to check
 * @returns {string} Icon character
 */
export function getChangeIcon(value) {
  if (value > 0) return '▲';
  if (value < 0) return '▼';
  return '●';
}

/**
 * Format large currency with smart decimals
 * @param {number} value - Value to format
 * @returns {string} Formatted value
 */
export function formatSmartCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0';
  }

  const absValue = Math.abs(value);

  if (absValue >= 1_000_000) {
    return formatCurrency(value, 0);
  } else if (absValue >= 1_000) {
    return formatCurrency(value, 0);
  } else if (absValue >= 1) {
    return formatCurrency(value, 2);
  } else {
    return formatCurrency(value, 4);
  }
}

/**
 * Parse formatted number back to number
 * @param {string} formatted - Formatted number string
 * @returns {number} Parsed number
 */
export function parseFormattedNumber(formatted) {
  if (!formatted) return 0;

  // Remove currency symbols, commas, and spaces
  let cleaned = formatted.replace(/[$,\s%]/g, '');

  // Handle K, M, B suffixes
  let multiplier = 1;
  if (cleaned.endsWith('K')) {
    multiplier = 1_000;
    cleaned = cleaned.slice(0, -1);
  } else if (cleaned.endsWith('M')) {
    multiplier = 1_000_000;
    cleaned = cleaned.slice(0, -1);
  } else if (cleaned.endsWith('B')) {
    multiplier = 1_000_000_000;
    cleaned = cleaned.slice(0, -1);
  }

  const number = parseFloat(cleaned);
  return isNaN(number) ? 0 : number * multiplier;
}
