/**
 * Blockchain Service
 * Handles all blockchain data fetching via explorer APIs
 */

import { CHAINS } from '../config/chains.js';
import { APP_CONFIG } from '../config/constants.js';

class BlockchainService {
  constructor() {
    this.cache = new Map();
    this.requestQueue = [];
    this.rateLimitDelay = 200; // 200ms between requests
  }

  /**
   * Fetch normal transactions
   * @param {string} address - Wallet address
   * @param {Object} chain - Chain configuration
   * @param {number} page - Page number
   * @param {number} offset - Results per page
   * @returns {Promise<Array>} Transactions
   */
  async fetchTransactions(address, chain, page = 1, offset = 100) {
    const cacheKey = `tx_${chain.name}_${address}_${page}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const url = `${chain.apiUrl}?module=account&action=txlist&address=${address}&page=${page}&offset=${offset}&sort=desc&apikey=${chain.apiKey}`;

    try {
      await this.rateLimitWait();
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && Array.isArray(data.result)) {
        this.cache.set(cacheKey, data.result);
        return data.result;
      }

      return [];
    } catch (error) {
      console.error(`Error fetching transactions from ${chain.name}:`, error);
      return [];
    }
  }

  /**
   * Fetch internal transactions
   * @param {string} address - Wallet address
   * @param {Object} chain - Chain configuration
   * @returns {Promise<Array>} Internal transactions
   */
  async fetchInternalTransactions(address, chain) {
    const cacheKey = `internal_${chain.name}_${address}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const url = `${chain.apiUrl}?module=account&action=txlistinternal&address=${address}&page=1&offset=100&sort=desc&apikey=${chain.apiKey}`;

    try {
      await this.rateLimitWait();
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && Array.isArray(data.result)) {
        this.cache.set(cacheKey, data.result);
        return data.result;
      }

      return [];
    } catch (error) {
      console.error(`Error fetching internal transactions from ${chain.name}:`, error);
      return [];
    }
  }

  /**
   * Fetch ERC20 token transfers
   * @param {string} address - Wallet address
   * @param {Object} chain - Chain configuration
   * @param {string} contractAddress - Optional: specific token contract
   * @returns {Promise<Array>} Token transfers
   */
  async fetchTokenTransfers(address, chain, contractAddress = null) {
    const cacheKey = `tokens_${chain.name}_${address}_${contractAddress || 'all'}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let url = `${chain.apiUrl}?module=account&action=tokentx&address=${address}&page=1&offset=10000&sort=desc&apikey=${chain.apiKey}`;

    if (contractAddress) {
      url += `&contractaddress=${contractAddress}`;
    }

    try {
      await this.rateLimitWait();
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && Array.isArray(data.result)) {
        this.cache.set(cacheKey, data.result);
        return data.result;
      }

      return [];
    } catch (error) {
      console.error(`Error fetching token transfers from ${chain.name}:`, error);
      return [];
    }
  }

  /**
   * Fetch ERC721 NFT transfers
   * @param {string} address - Wallet address
   * @param {Object} chain - Chain configuration
   * @returns {Promise<Array>} NFT transfers
   */
  async fetchNFTTransfers(address, chain) {
    const cacheKey = `nft_${chain.name}_${address}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const url = `${chain.apiUrl}?module=account&action=tokennfttx&address=${address}&page=1&offset=100&sort=desc&apikey=${chain.apiKey}`;

    try {
      await this.rateLimitWait();
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && Array.isArray(data.result)) {
        this.cache.set(cacheKey, data.result);
        return data.result;
      }

      return [];
    } catch (error) {
      console.error(`Error fetching NFT transfers from ${chain.name}:`, error);
      return [];
    }
  }

  /**
   * Fetch transaction logs (events)
   * @param {string} address - Contract address
   * @param {Object} chain - Chain configuration
   * @param {string} fromBlock - Starting block
   * @param {string} toBlock - Ending block
   * @param {string} topic0 - Event signature
   * @returns {Promise<Array>} Logs
   */
  async fetchLogs(address, chain, fromBlock = '0', toBlock = 'latest', topic0 = null) {
    const cacheKey = `logs_${chain.name}_${address}_${fromBlock}_${toBlock}_${topic0}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let url = `${chain.apiUrl}?module=logs&action=getLogs&address=${address}&fromBlock=${fromBlock}&toBlock=${toBlock}&apikey=${chain.apiKey}`;

    if (topic0) {
      url += `&topic0=${topic0}`;
    }

    try {
      await this.rateLimitWait();
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && Array.isArray(data.result)) {
        this.cache.set(cacheKey, data.result);
        return data.result;
      }

      return [];
    } catch (error) {
      console.error(`Error fetching logs from ${chain.name}:`, error);
      return [];
    }
  }

  /**
   * Fetch native balance
   * @param {string} address - Wallet address
   * @param {Object} chain - Chain configuration
   * @returns {Promise<string>} Balance in native currency
   */
  async fetchNativeBalance(address, chain) {
    const url = `${chain.apiUrl}?module=account&action=balance&address=${address}&tag=latest&apikey=${chain.apiKey}`;

    try {
      await this.rateLimitWait();
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1') {
        return (parseInt(data.result) / 1e18).toString();
      }

      return '0';
    } catch (error) {
      console.error(`Error fetching balance from ${chain.name}:`, error);
      return '0';
    }
  }

  /**
   * Fetch ERC20 token balance
   * @param {string} address - Wallet address
   * @param {string} contractAddress - Token contract address
   * @param {Object} chain - Chain configuration
   * @returns {Promise<string>} Token balance
   */
  async fetchTokenBalance(address, contractAddress, chain) {
    const url = `${chain.apiUrl}?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest&apikey=${chain.apiKey}`;

    try {
      await this.rateLimitWait();
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1') {
        return data.result;
      }

      return '0';
    } catch (error) {
      console.error(`Error fetching token balance from ${chain.name}:`, error);
      return '0';
    }
  }

  /**
   * Fetch contract ABI
   * @param {string} contractAddress - Contract address
   * @param {Object} chain - Chain configuration
   * @returns {Promise<Array|null>} ABI or null
   */
  async fetchContractABI(contractAddress, chain) {
    const cacheKey = `abi_${chain.name}_${contractAddress}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const url = `${chain.apiUrl}?module=contract&action=getabi&address=${contractAddress}&apikey=${chain.apiKey}`;

    try {
      await this.rateLimitWait();
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1') {
        const abi = JSON.parse(data.result);
        this.cache.set(cacheKey, abi);
        return abi;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching ABI from ${chain.name}:`, error);
      return null;
    }
  }

  /**
   * Fetch all data for an address across multiple chains
   * @param {string} address - Wallet address
   * @param {Array<string>} chainKeys - Chain keys to fetch from
   * @returns {Promise<Object>} All blockchain data
   */
  async fetchAllChainData(address, chainKeys = Object.keys(CHAINS)) {
    console.log(`📊 Fetching data for ${address} across ${chainKeys.length} chains...`);

    const results = {};

    // Fetch in parallel for all chains
    const promises = chainKeys.map(async (chainKey) => {
      const chain = CHAINS[chainKey];
      console.log(`  ⛓️ Fetching ${chain.name}...`);

      const [transactions, internalTx, tokenTransfers, nftTransfers, balance] = await Promise.all([
        this.fetchTransactions(address, chain),
        this.fetchInternalTransactions(address, chain),
        this.fetchTokenTransfers(address, chain),
        this.fetchNFTTransfers(address, chain),
        this.fetchNativeBalance(address, chain)
      ]);

      results[chainKey] = {
        chain,
        transactions,
        internalTx,
        tokenTransfers,
        nftTransfers,
        balance
      };

      console.log(`  ✅ ${chain.name}: ${transactions.length} tx, ${tokenTransfers.length} token tx`);
    });

    await Promise.all(promises);

    console.log('✅ All chain data fetched');
    return results;
  }

  /**
   * Rate limiting
   */
  async rateLimitWait() {
    return new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  /**
   * Get cache size
   */
  getCacheSize() {
    return this.cache.size;
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
