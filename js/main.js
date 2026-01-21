/**
 * AutoTrack Liquidity - Main Application
 * Automated LP Position Tracker
 */

import { walletService } from './services/wallet.js';
import { blockchainService } from './services/blockchain.js';
import { lpDetector } from './services/lpDetector.js';
import { pnlCalculator } from './services/pnlCalculator.js';
import { priceService } from './services/priceService.js';
import { Dashboard } from './components/dashboard.js';
import { LPPositionsTable } from './components/lpPositions.js';
import { CHAINS } from './config/chains.js';

console.log('🎯 AutoTrack Main Script Loading...');

class AutoTrackApp {
  constructor() {
    console.log('🎯 AutoTrack App Constructor');

    this.dashboard = null;
    this.positionsTable = null;
    this.currentPositions = [];
    this.isLoading = false;

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  /**
   * Initialize application
   */
  async init() {
    console.log('🎯 AutoTrack Liquidity - Initializing...');

    // Initialize components
    this.dashboard = new Dashboard('dashboardContainer');
    this.positionsTable = new LPPositionsTable('positionsContainer');

    // Setup event listeners
    this.setupEventListeners();

    // Setup wallet listeners
    this.setupWalletListeners();

    // Check if already connected
    try {
      const isConnected = await walletService.checkIfConnected();
      if (isConnected) {
        this.onWalletConnected();
        await this.loadPortfolio();
      } else {
        this.showWelcomeScreen();
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      this.showWelcomeScreen();
    }

    console.log('✅ Application initialized');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    console.log('📌 Setting up event listeners...');

    // Connect wallet button
    const connectBtn = document.getElementById('connectWalletBtn');
    if (connectBtn) {
      console.log('✅ Found connect button');
      connectBtn.addEventListener('click', () => {
        console.log('🔘 Connect button clicked');
        this.connectWallet();
      });
    } else {
      console.error('❌ Connect button not found!');
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      console.log('✅ Found refresh button');
      refreshBtn.addEventListener('click', () => {
        console.log('🔘 Refresh button clicked');
        this.loadPortfolio();
      });
    }

    console.log('✅ Event listeners setup complete');
  }

  /**
   * Setup wallet event listeners for auto-switching
   */
  setupWalletListeners() {
    // Account changed - reload data
    walletService.on('accountChanged', async (newAddress) => {
      console.log('👤 Account changed to:', newAddress);
      this.showLoading('Switching account...');
      await this.loadPortfolio();
    });

    // Chain changed - reload data automatically
    walletService.on('chainChanged', async ({ chain }) => {
      console.log('⛓️ Chain changed to:', chain?.name);

      if (chain) {
        this.showNotification(`Switched to ${chain.name}`, 'info');
        this.showLoading(`Loading data from ${chain.name}...`);
        await this.loadPortfolio();
      } else {
        this.showNotification('Unsupported chain. Please switch to a supported network.', 'warning');
      }
    });

    // Disconnected
    walletService.on('disconnected', () => {
      console.log('🔌 Wallet disconnected');
      this.onWalletDisconnected();
    });
  }

  /**
   * Connect wallet
   */
  async connectWallet() {
    console.log('🔗 Connecting wallet...');

    try {
      this.showLoading('Connecting wallet...');

      const result = await walletService.connect();

      if (result.success) {
        console.log('✅ Wallet connected successfully');
        this.onWalletConnected();
        this.showNotification(`Connected to ${result.chain?.name || 'network'}`, 'success');

        // Show refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) refreshBtn.style.display = 'inline-block';

        await this.loadPortfolio();
      }
    } catch (error) {
      console.error('❌ Connection error:', error);
      this.showNotification('Failed to connect wallet: ' + error.message, 'error');
      this.hideLoading();
    }
  }

  /**
   * Load portfolio data
   */
  async loadPortfolio() {
    if (this.isLoading) {
      console.log('⏳ Already loading...');
      return;
    }

    this.isLoading = true;
    this.showLoading('Loading your LP positions...');

    try {
      const address = walletService.getAddress();
      if (!address) {
        throw new Error('No wallet connected');
      }

      console.log('📊 Loading portfolio for:', address);

      // Step 1: Fetch blockchain data from all chains
      const chainData = await blockchainService.fetchAllChainData(
        address,
        Object.keys(CHAINS)
      );

      // Step 2: Detect LP positions
      const { positions } = await lpDetector.analyzeChainData(chainData, address);

      // Step 3: Calculate PnL for all positions
      const positionsWithPnL = await pnlCalculator.calculateAllPositions(positions);

      // Store positions
      this.currentPositions = positionsWithPnL;

      // Render dashboard and positions
      if (positionsWithPnL.length > 0) {
        this.dashboard.render(positionsWithPnL);
        this.positionsTable.render(positionsWithPnL);
        this.showMainView();
      } else {
        this.showEmptyState();
      }

      this.showNotification('Portfolio loaded successfully', 'success');

    } catch (error) {
      console.error('❌ Error loading portfolio:', error);
      this.showNotification('Error loading portfolio: ' + error.message, 'error');
      this.showEmptyState();
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }

  /**
   * Wallet connected handler
   */
  onWalletConnected() {
    const address = walletService.getAddress();
    const chain = walletService.getCurrentChain();

    // Update UI
    const connectBtn = document.getElementById('connectWalletBtn');
    if (connectBtn) {
      connectBtn.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
      connectBtn.classList.add('connected');
    }

    const chainIndicator = document.getElementById('chainIndicator');
    if (chainIndicator && chain) {
      chainIndicator.innerHTML = `
        <span class="chain-icon">${chain.icon}</span>
        <span>${chain.name}</span>
      `;
      chainIndicator.style.display = 'flex';
    }
  }

  /**
   * Wallet disconnected handler
   */
  onWalletDisconnected() {
    const connectBtn = document.getElementById('connectWalletBtn');
    if (connectBtn) {
      connectBtn.textContent = 'Connect Wallet';
      connectBtn.classList.remove('connected');
    }

    const chainIndicator = document.getElementById('chainIndicator');
    if (chainIndicator) {
      chainIndicator.style.display = 'none';
    }

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.style.display = 'none';

    this.currentPositions = [];
    this.showWelcomeScreen();
  }

  /**
   * Show welcome screen
   */
  showWelcomeScreen() {
    this.hideElement('loadingContainer');
    this.hideElement('mainView');
    this.showElement('welcomeScreen');
  }

  /**
   * Show main view
   */
  showMainView() {
    this.hideElement('welcomeScreen');
    this.hideElement('loadingContainer');
    this.showElement('mainView');
  }

  /**
   * Show loading state
   * @param {string} message - Loading message
   */
  showLoading(message = 'Loading...') {
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) {
      const loadingText = loadingContainer.querySelector('.loading-text');
      if (loadingText) loadingText.textContent = message;
      this.showElement('loadingContainer');
      this.hideElement('welcomeScreen');
      this.hideElement('mainView');
    }
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.hideElement('loadingContainer');
  }

  /**
   * Show empty state
   */
  showEmptyState() {
    this.showMainView();
    this.dashboard.showEmpty();
    this.positionsTable.showEmpty();
  }

  /**
   * Show notification
   * @param {string} message - Message
   * @param {string} type - Type (success, error, warning, info)
   */
  showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add to DOM
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  /**
   * Show element
   * @param {string} id - Element ID
   */
  showElement(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('hidden');
    } else {
      console.warn(`Element not found: ${id}`);
    }
  }

  /**
   * Hide element
   * @param {string} id - Element ID
   */
  hideElement(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('hidden');
    } else {
      console.warn(`Element not found: ${id}`);
    }
  }
}

// Initialize app
console.log('📌 Creating AutoTrackApp instance...');
const app = new AutoTrackApp();
window.app = app;

console.log('✅ Main script loaded');
