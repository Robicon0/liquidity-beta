/**
 * Application Constants
 */

export const APP_CONFIG = {
  name: 'AutoTrack Liquidity',
  version: '0.1.0',
  description: 'Automated DeFi LP Position Tracker',

  // Data refresh intervals (milliseconds)
  refreshInterval: {
    portfolio: 60000,      // 1 minute
    prices: 30000,         // 30 seconds
    positions: 120000      // 2 minutes
  },

  // API rate limiting
  rateLimits: {
    etherscan: 5,          // 5 requests per second
    coingecko: 50          // 50 requests per minute
  },

  // Pagination
  pagination: {
    transactionsPerPage: 100,
    maxTransactions: 10000
  },

  // Storage keys
  storageKeys: {
    walletAddress: 'autotrack_wallet',
    positions: 'autotrack_positions',
    customPrices: 'autotrack_custom_prices',
    preferences: 'autotrack_preferences',
    editableData: 'autotrack_editable_data'
  },

  // Display settings
  display: {
    currencySymbol: '$',
    currencyCode: 'USD',
    decimalPlaces: {
      currency: 2,
      tokens: 4,
      percentage: 2
    }
  }
};

/**
 * Price API Configuration
 */
export const PRICE_API = {
  coingecko: {
    baseUrl: 'https://api.coingecko.com/api/v3',
    endpoints: {
      simple: '/simple/price',
      coin: '/coins'
    }
  },
  // Fallback to CoinMarketCap or other services if needed
  coinmarketcap: {
    baseUrl: 'https://pro-api.coinmarketcap.com/v1',
    apiKey: 'YOUR_CMC_API_KEY' // Optional fallback
  }
};

/**
 * Token ID mappings for price APIs
 */
export const TOKEN_MAPPINGS = {
  // CoinGecko IDs
  coingecko: {
    'ETH': 'ethereum',
    'WETH': 'ethereum',
    'MATIC': 'matic-network',
    'WMATIC': 'matic-network',
    'BNB': 'binancecoin',
    'WBNB': 'binancecoin',
    'USDC': 'usd-coin',
    'USDT': 'tether',
    'DAI': 'dai',
    'WBTC': 'wrapped-bitcoin',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'AAVE': 'aave',
    'CRV': 'curve-dao-token',
    'BAL': 'balancer',
    'SUSHI': 'sushi'
  }
};

/**
 * Transaction types
 */
export const TX_TYPES = {
  ADD_LIQUIDITY: 'add_liquidity',
  REMOVE_LIQUIDITY: 'remove_liquidity',
  COLLECT_FEES: 'collect_fees',
  SWAP: 'swap',
  TRANSFER: 'transfer',
  UNKNOWN: 'unknown'
};

/**
 * Position status
 */
export const POSITION_STATUS = {
  ACTIVE: 'active',
  CLOSED: 'closed',
  PARTIAL: 'partial'
};

/**
 * Error messages
 */
export const ERRORS = {
  NO_WALLET: 'Please install MetaMask or another Web3 wallet',
  WRONG_NETWORK: 'Please switch to a supported network',
  CONNECTION_FAILED: 'Failed to connect to wallet',
  API_ERROR: 'API request failed',
  NO_DATA: 'No data available',
  INVALID_ADDRESS: 'Invalid wallet address'
};

/**
 * Success messages
 */
export const MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully',
  DATA_LOADED: 'Portfolio data loaded',
  POSITION_SAVED: 'Position data saved',
  SETTINGS_SAVED: 'Settings saved'
};

/**
 * Color scheme
 */
export const COLORS = {
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',

  // Chart colors
  chart: [
    '#667eea',
    '#764ba2',
    '#f59e0b',
    '#22c55e',
    '#ef4444',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899'
  ]
};
