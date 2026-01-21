/**
 * Chain Configuration
 * Contains all supported blockchain networks with their API endpoints
 */

export const CHAINS = {
  ethereum: {
    id: '0x1',
    chainId: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    apiUrl: 'https://api.etherscan.io/api',
    apiKey: '7985AZCNWY5J9K4PB84WR4APQ4UBAPEPCH',
    icon: '⟠',
    color: '#627EEA',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },

  polygon: {
    id: '0x89',
    chainId: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    apiUrl: 'https://api.polygonscan.com/api',
    apiKey: 'YourPolygonAPIKey', // Replace with actual key
    icon: '⬡',
    color: '#8247E5',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    }
  },

  base: {
    id: '0x2105',
    chainId: 8453,
    name: 'Base',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    apiUrl: 'https://api.basescan.org/api',
    apiKey: 'YourBaseAPIKey', // Replace with actual key
    icon: '🔵',
    color: '#0052FF',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },

  arbitrum: {
    id: '0xa4b1',
    chainId: 42161,
    name: 'Arbitrum',
    symbol: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    apiUrl: 'https://api.arbiscan.io/api',
    apiKey: 'YourArbitrumAPIKey', // Replace with actual key
    icon: '◆',
    color: '#28A0F0',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },

  optimism: {
    id: '0xa',
    chainId: 10,
    name: 'Optimism',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    apiUrl: 'https://api-optimistic.etherscan.io/api',
    apiKey: 'YourOptimismAPIKey', // Replace with actual key
    icon: '○',
    color: '#FF0420',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },

  bsc: {
    id: '0x38',
    chainId: 56,
    name: 'BNB Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    apiUrl: 'https://api.bscscan.com/api',
    apiKey: 'YourBSCAPIKey', // Replace with actual key
    icon: '◈',
    color: '#F3BA2F',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    }
  }
};

/**
 * Get chain configuration by chain ID
 * @param {number|string} chainId - Chain ID (number or hex string)
 * @returns {Object|null} Chain configuration or null
 */
export function getChainById(chainId) {
  const id = typeof chainId === 'number' ? `0x${chainId.toString(16)}` : chainId;
  return Object.values(CHAINS).find(chain => chain.id === id) || null;
}

/**
 * Get chain configuration by name
 * @param {string} name - Chain name
 * @returns {Object|null} Chain configuration or null
 */
export function getChainByName(name) {
  return CHAINS[name.toLowerCase()] || null;
}

/**
 * Check if chain is supported
 * @param {number|string} chainId - Chain ID
 * @returns {boolean} True if supported
 */
export function isChainSupported(chainId) {
  return getChainById(chainId) !== null;
}

/**
 * Get all supported chain IDs
 * @returns {string[]} Array of hex chain IDs
 */
export function getSupportedChainIds() {
  return Object.values(CHAINS).map(chain => chain.id);
}
