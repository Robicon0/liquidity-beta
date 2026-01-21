/**
 * Wallet Service
 * Handles wallet connection, chain switching, and account management
 * Supports MetaMask, Rabby, and other EIP-1193 compatible wallets
 */

import { CHAINS, getChainById, isChainSupported } from '../config/chains.js';
import { APP_CONFIG, ERRORS, MESSAGES } from '../config/constants.js';

class WalletService {
  constructor() {
    this.provider = null;
    this.address = null;
    this.chainId = null;
    this.isConnected = false;
    this.walletType = null;
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
    console.log('🔌 Initializing wallet service...');

    // Detect wallet provider
    this.detectProvider();

    if (this.provider) {
      console.log(`✅ Wallet detected: ${this.walletType}`);
      this.setupEventListeners();
      this.checkIfConnected();
    } else {
      console.warn('⚠️ No Web3 wallet detected');
    }
  }

  /**
   * Detect wallet provider (Rabby, MetaMask, etc.)
   */
  detectProvider() {
    // Check for Rabby first (it sets window.ethereum too)
    if (typeof window.ethereum !== 'undefined') {
      if (window.ethereum.isRabby) {
        this.provider = window.ethereum;
        this.walletType = 'Rabby';
        console.log('🦊 Rabby wallet detected');
      } else if (window.ethereum.isMetaMask) {
        this.provider = window.ethereum;
        this.walletType = 'MetaMask';
        console.log('🦊 MetaMask detected');
      } else {
        // Generic EIP-1193 provider
        this.provider = window.ethereum;
        this.walletType = 'Web3 Wallet';
        console.log('👛 Generic Web3 wallet detected');
      }
    }

    // Fallback for other wallets
    if (!this.provider && typeof window.web3 !== 'undefined') {
      this.provider = window.web3.currentProvider;
      this.walletType = 'Legacy Web3';
      console.log('🔧 Legacy Web3 provider detected');
    }
  }

  /**
   * Setup wallet event listeners for auto-switching
   */
  setupEventListeners() {
    if (!this.provider) return;

    console.log('📡 Setting up wallet event listeners...');

    try {
      // Account changed - auto reload data
      this.provider.on('accountsChanged', (accounts) => {
        console.log('🔄 Account changed:', accounts[0] || 'disconnected');

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

      console.log('✅ Event listeners setup complete');
    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  }

  /**
   * Check if wallet is already connected
   */
  async checkIfConnected() {
    if (!this.provider) return false;

    try {
      console.log('🔍 Checking if wallet is already connected...');

      const accounts = await this.provider.request({ method: 'eth_accounts' });

      if (accounts && accounts.length > 0) {
        this.address = accounts[0];
        this.chainId = await this.provider.request({ method: 'eth_chainId' });
        this.isConnected = true;

        // Store in localStorage
        localStorage.setItem(APP_CONFIG.storageKeys.walletAddress, this.address);

        console.log('✅ Wallet already connected:', this.address);
        console.log('⛓️ Chain:', this.chainId);
        return true;
      }

      console.log('ℹ️ Wallet not connected yet');
      return false;
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  }

  /**
   * Connect wallet
   * @returns {Promise<Object>} Connection result
   */
  async connect() {
    console.log('🔗 Connecting wallet...');

    if (!this.provider) {
      const error = `${ERRORS.NO_WALLET}\n\nPlease install:\n- Rabby: https://rabby.io\n- MetaMask: https://metamask.io`;
      console.error('❌', error);
      throw new Error(error);
    }

    try {
      console.log(`🔌 Requesting connection to ${this.walletType}...`);

      // Request account access
      const accounts = await this.provider.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from wallet');
      }

      this.address = accounts[0];
      this.chainId = await this.provider.request({ method: 'eth_chainId' });
      this.isConnected = true;

      // Store connection
      localStorage.setItem(APP_CONFIG.storageKeys.walletAddress, this.address);

      const chain = getChainById(this.chainId);

      console.log('✅', MESSAGES.WALLET_CONNECTED);
      console.log('   Wallet:', this.walletType);
      console.log('   Address:', this.address);
      console.log('   Chain:', chain?.name || this.chainId);

      this.emit('connected', {
        address: this.address,
        chainId: this.chainId,
        chain,
        walletType: this.walletType
      });

      return {
        success: true,
        address: this.address,
        chainId: this.chainId,
        chain,
        walletType: this.walletType
      };

    } catch (error) {
      console.error('❌ Connection failed:', error);

      if (error.code === 4001) {
        throw new Error('Connection rejected by user');
      } else if (error.code === -32002) {
        throw new Error('Connection request already pending. Please check your wallet.');
      }

      throw new Error(ERRORS.CONNECTION_FAILED + ': ' + error.message);
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
    console.log('🔌 Handling disconnect...');

    this.address = null;
    this.chainId = null;
    this.isConnected = false;

    localStorage.removeItem(APP_CONFIG.storageKeys.walletAddress);

    this.emit('disconnected');

    console.log('✅ Disconnect handled');
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
   * Get wallet type
   * @returns {string|null} Wallet type
   */
  getWalletType() {
    return this.walletType;
  }

  /**
   * Check if provider is available
   * @returns {boolean} Provider availability
   */
  isProviderAvailable() {
    return this.provider !== null;
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
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Get ETH balance
   * @returns {Promise<string>} Balance in ETH
   */
  async getBalance() {
    if (!this.address || !this.provider) return '0';

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

// Log initialization
console.log('✅ Wallet service module loaded');
