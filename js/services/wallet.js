/**
 * Wallet Service
 * Handles wallet connection, chain switching, and account management
 */

import { CHAINS, getChainById, isChainSupported } from '../config/chains.js';
import { APP_CONFIG, ERRORS, MESSAGES } from '../config/constants.js';

class WalletService {
  constructor() {
    this.provider = null;
    this.address = null;
    this.chainId = null;
    this.isConnected = false;
    this.listeners = {
      accountChanged: [],
      chainChanged: [],
      connected: [],
      disconnected: []
    };

    this.init();
  }

  /**
   * Initialize wallet service
   */
  init() {
    if (typeof window.ethereum !== 'undefined') {
      this.provider = window.ethereum;
      this.setupEventListeners();
      this.checkIfConnected();
    }
  }

  /**
   * Setup wallet event listeners for auto-switching
   */
  setupEventListeners() {
    if (!this.provider) return;

    // Account changed - auto reload data
    this.provider.on('accountsChanged', (accounts) => {
      console.log('🔄 Account changed:', accounts[0]);

      if (accounts.length === 0) {
        this.handleDisconnect();
      } else {
        this.address = accounts[0];
        this.emit('accountChanged', accounts[0]);
      }
    });

    // Chain changed - auto reload data for new chain
    this.provider.on('chainChanged', (chainId) => {
      console.log('⛓️ Chain changed:', chainId);

      this.chainId = chainId;
      const chain = getChainById(chainId);

      if (chain) {
        console.log(`✅ Switched to ${chain.name}`);
        this.emit('chainChanged', { chainId, chain });
      } else {
        console.warn('⚠️ Unsupported chain:', chainId);
        this.emit('chainChanged', { chainId, chain: null });
      }
    });

    // Disconnect
    this.provider.on('disconnect', () => {
      console.log('🔌 Wallet disconnected');
      this.handleDisconnect();
    });
  }

  /**
   * Check if wallet is already connected
   */
  async checkIfConnected() {
    try {
      const accounts = await this.provider.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        this.address = accounts[0];
        this.chainId = await this.provider.request({ method: 'eth_chainId' });
        this.isConnected = true;

        // Store in localStorage
        localStorage.setItem(APP_CONFIG.storageKeys.walletAddress, this.address);

        console.log('✅ Wallet already connected:', this.address);
        return true;
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
    return false;
  }

  /**
   * Connect wallet
   * @returns {Promise<Object>} Connection result
   */
  async connect() {
    if (!this.provider) {
      throw new Error(ERRORS.NO_WALLET);
    }

    try {
      console.log('🔗 Connecting wallet...');

      // Request account access
      const accounts = await this.provider.request({
        method: 'eth_requestAccounts'
      });

      this.address = accounts[0];
      this.chainId = await this.provider.request({ method: 'eth_chainId' });
      this.isConnected = true;

      // Store connection
      localStorage.setItem(APP_CONFIG.storageKeys.walletAddress, this.address);

      const chain = getChainById(this.chainId);

      console.log('✅', MESSAGES.WALLET_CONNECTED);
      console.log('   Address:', this.address);
      console.log('   Chain:', chain?.name || 'Unknown');

      this.emit('connected', {
        address: this.address,
        chainId: this.chainId,
        chain
      });

      return {
        success: true,
        address: this.address,
        chainId: this.chainId,
        chain
      };

    } catch (error) {
      console.error('❌ Connection failed:', error);
      throw new Error(ERRORS.CONNECTION_FAILED);
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    this.handleDisconnect();
  }

  /**
   * Handle disconnect
   */
  handleDisconnect() {
    this.address = null;
    this.chainId = null;
    this.isConnected = false;

    localStorage.removeItem(APP_CONFIG.storageKeys.walletAddress);

    this.emit('disconnected');
  }

  /**
   * Switch to a specific chain
   * @param {string} chainKey - Chain key from CHAINS config
   * @returns {Promise<boolean>} Success status
   */
  async switchChain(chainKey) {
    const chain = CHAINS[chainKey];
    if (!chain) {
      throw new Error(`Unknown chain: ${chainKey}`);
    }

    try {
      console.log(`🔄 Switching to ${chain.name}...`);

      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chain.id }]
      });

      console.log(`✅ Switched to ${chain.name}`);
      return true;

    } catch (error) {
      // Chain not added to wallet, try adding it
      if (error.code === 4902) {
        return await this.addChain(chainKey);
      }

      console.error('❌ Failed to switch chain:', error);
      throw error;
    }
  }

  /**
   * Add a new chain to wallet
   * @param {string} chainKey - Chain key from CHAINS config
   * @returns {Promise<boolean>} Success status
   */
  async addChain(chainKey) {
    const chain = CHAINS[chainKey];
    if (!chain) {
      throw new Error(`Unknown chain: ${chainKey}`);
    }

    try {
      console.log(`➕ Adding ${chain.name} to wallet...`);

      await this.provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: chain.id,
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: [chain.rpcUrl],
          blockExplorerUrls: [chain.explorerUrl]
        }]
      });

      console.log(`✅ ${chain.name} added successfully`);
      return true;

    } catch (error) {
      console.error('❌ Failed to add chain:', error);
      throw error;
    }
  }

  /**
   * Get current chain info
   * @returns {Object|null} Chain configuration
   */
  getCurrentChain() {
    return getChainById(this.chainId);
  }

  /**
   * Get wallet address
   * @returns {string|null} Wallet address
   */
  getAddress() {
    return this.address;
  }

  /**
   * Get chain ID
   * @returns {string|null} Chain ID
   */
  getChainId() {
    return this.chainId;
  }

  /**
   * Check if wallet is connected
   * @returns {boolean} Connection status
   */
  isWalletConnected() {
    return this.isConnected;
  }

  /**
   * Event emitter - on
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  /**
   * Event emitter - off
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Event emitter - emit
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  /**
   * Get ETH balance
   * @returns {Promise<string>} Balance in ETH
   */
  async getBalance() {
    if (!this.address) return '0';

    try {
      const balance = await this.provider.request({
        method: 'eth_getBalance',
        params: [this.address, 'latest']
      });

      return (parseInt(balance, 16) / 1e18).toString();
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }
}

// Export singleton instance
export const walletService = new WalletService();
