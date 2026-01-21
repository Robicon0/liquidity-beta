/**
 * Helper Utilities
 * General helper functions
 */

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Group array by key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} Grouped object
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
}

/**
 * Sort array by key
 * @param {Array} array - Array to sort
 * @param {string} key - Key to sort by
 * @param {string} direction - 'asc' or 'desc'
 * @returns {Array} Sorted array
 */
export function sortBy(array, key, direction = 'asc') {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Filter array with multiple conditions
 * @param {Array} array - Array to filter
 * @param {Object} conditions - Filter conditions
 * @returns {Array} Filtered array
 */
export function filterBy(array, conditions) {
  return array.filter(item => {
    return Object.entries(conditions).every(([key, value]) => {
      if (typeof value === 'function') {
        return value(item[key]);
      }
      return item[key] === value;
    });
  });
}

/**
 * Calculate sum of array values
 * @param {Array} array - Array of numbers or objects
 * @param {string} key - Key to sum (if objects)
 * @returns {number} Sum
 */
export function sum(array, key = null) {
  if (key) {
    return array.reduce((total, item) => total + (item[key] || 0), 0);
  }
  return array.reduce((total, value) => total + (value || 0), 0);
}

/**
 * Calculate average
 * @param {Array} array - Array of numbers
 * @returns {number} Average
 */
export function average(array) {
  if (array.length === 0) return 0;
  return sum(array) / array.length;
}

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} True if empty
 */
export function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate string
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add
 * @returns {string} Truncated string
 */
export function truncate(str, maxLength = 50, suffix = '...') {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength) + suffix;
}

/**
 * Copy to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Open URL in new tab
 * @param {string} url - URL to open
 */
export function openInNewTab(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Build explorer URL for transaction
 * @param {string} txHash - Transaction hash
 * @param {Object} chain - Chain configuration
 * @returns {string} Explorer URL
 */
export function getExplorerTxUrl(txHash, chain) {
  return `${chain.explorerUrl}/tx/${txHash}`;
}

/**
 * Build explorer URL for address
 * @param {string} address - Address
 * @param {Object} chain - Chain configuration
 * @returns {string} Explorer URL
 */
export function getExplorerAddressUrl(address, chain) {
  return `${chain.explorerUrl}/address/${address}`;
}

/**
 * Build explorer URL for token
 * @param {string} tokenAddress - Token contract address
 * @param {Object} chain - Chain configuration
 * @returns {string} Explorer URL
 */
export function getExplorerTokenUrl(tokenAddress, chain) {
  return `${chain.explorerUrl}/token/${tokenAddress}`;
}

/**
 * Check if value is valid number
 * @param {*} value - Value to check
 * @returns {boolean} True if valid number
 */
export function isValidNumber(value) {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Clamp number between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get random item from array
 * @param {Array} array - Array
 * @returns {*} Random item
 */
export function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffle array
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
export function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
