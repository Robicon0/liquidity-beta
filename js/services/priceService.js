/**
 * Price Service
 * Fetches and manages token prices with caching and custom overrides
 */

import { PRICE_API, TOKEN_MAPPINGS, APP_CONFIG } from '../config/constants.js';

class PriceService {
  constructor() {
    this.prices = new Map();
    this.customPrices = new Map();
    this.lastUpdate = null;
    this.updateInterval = null;

    this.loadCustomPrices();
  }

  /**
   * Get token price
   * @param {string} symbol - Token symbol
   * @param {boolean} useCustom - Use custom price if available
   * @returns {Promise<number>} Price in USD
   */
  async getPrice(symbol, useCustom = true) {
    const symbolUpper = symbol.toUpperCase();

    // Check custom prices first
    if (useCustom && this.customPrices.has(symbolUpper)) {
      return this.customPrices.get(symbolUpper);
    }

    // Check cache
    if (this.prices.has(symbolUpper)) {
      const cached = this.prices.get(symbolUpper);
      const age = Date.now() - cached.timestamp;

      // Cache valid for 30 seconds
      if (age < 30000) {
        return cached.price;
      }
    }

    // Fetch new price
    try {
      const price = await this.fetchPrice(symbolUpper);
      this.prices.set(symbolUpper, {
        price,
        timestamp: Date.now()
      });
      return price;
    } catch (error) {
      console.error(`Error fetching price for ${symbolUpper}:`, error);

      // Return cached price even if stale, or fallback
      if (this.prices.has(symbolUpper)) {
        return this.prices.get(symbolUpper).price;
      }

      return this.getFallbackPrice(symbolUpper);
    }
  }

  /**
   * Fetch price from CoinGecko
   * @param {string} symbol - Token symbol
   * @returns {Promise<number>} Price in USD
   */
  async fetchPrice(symbol) {
    const coinId = TOKEN_MAPPINGS.coingecko[symbol];

    if (!coinId) {
      console.warn(`No CoinGecko ID mapping for ${symbol}`);
      return this.getFallbackPrice(symbol);
    }

    const url = `${PRICE_API.coingecko.baseUrl}${PRICE_API.coingecko.endpoints.simple}?ids=${coinId}&vs_currencies=usd`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data[coinId] && data[coinId].usd) {
        return data[coinId].usd;
      }

      return this.getFallbackPrice(symbol);
    } catch (error) {
      console.error(`CoinGecko fetch error for ${symbol}:`, error);
      return this.getFallbackPrice(symbol);
    }
  }

  /**
   * Get multiple prices at once
   * @param {Array<string>} symbols - Token symbols
   * @returns {Promise<Object>} Symbol to price mapping
   */
  async getPrices(symbols) {
    const uniqueSymbols = [...new Set(symbols)];
    const prices = {};

    // Get CoinGecko IDs for all tokens
    const coinIds = uniqueSymbols
      .map(s => TOKEN_MAPPINGS.coingecko[s.toUpperCase()])
      .filter(id => id);

    if (coinIds.length === 0) {
      // No mappings found, use fallback for all
      uniqueSymbols.forEach(symbol => {
        prices[symbol] = this.getFallbackPrice(symbol.toUpperCase());
      });
      return prices;
    }

    try {
      const url = `${PRICE_API.coingecko.baseUrl}${PRICE_API.coingecko.endpoints.simple}?ids=${coinIds.join(',')}&vs_currencies=usd`;
      const response = await fetch(url);
      const data = await response.json();

      // Map results back to symbols
      uniqueSymbols.forEach(symbol => {
        const symbolUpper = symbol.toUpperCase();

        // Check custom price
        if (this.customPrices.has(symbolUpper)) {
          prices[symbol] = this.customPrices.get(symbolUpper);
          return;
        }

        const coinId = TOKEN_MAPPINGS.coingecko[symbolUpper];
        if (coinId && data[coinId] && data[coinId].usd) {
          prices[symbol] = data[coinId].usd;

          // Cache it
          this.prices.set(symbolUpper, {
            price: data[coinId].usd,
            timestamp: Date.now()
          });
        } else {
          prices[symbol] = this.getFallbackPrice(symbolUpper);
        }
      });

      return prices;
    } catch (error) {
      console.error('Error fetching multiple prices:', error);

      // Return fallback for all
      uniqueSymbols.forEach(symbol => {
        prices[symbol] = this.getFallbackPrice(symbol.toUpperCase());
      });

      return prices;
    }
  }

  /**
   * Get fallback price for common tokens
   * @param {string} symbol - Token symbol
   * @returns {number} Fallback price
   */
  getFallbackPrice(symbol) {
    const fallbackPrices = {
      'ETH': 3500,
      'WETH': 3500,
      'MATIC': 0.85,
      'WMATIC': 0.85,
      'BNB': 600,
      'WBNB': 600,
      'USDC': 1.00,
      'USDT': 1.00,
      'DAI': 1.00,
      'BUSD': 1.00,
      'USDD': 1.00,
      'FRAX': 1.00,
      'WBTC': 95000,
      'BTC': 95000,
      'LINK': 22,
      'UNI': 12,
      'AAVE': 285,
      'CRV': 0.95,
      'BAL': 5,
      'SUSHI': 1.8,
      'COMP': 75,
      'MKR': 2800
    };

    return fallbackPrices[symbol] || 0;
  }

  /**
   * Set custom price for a token (editable feature)
   * @param {string} symbol - Token symbol
   * @param {number} price - Custom price
   */
  setCustomPrice(symbol, price) {
    const symbolUpper = symbol.toUpperCase();
    this.customPrices.set(symbolUpper, price);
    this.saveCustomPrices();
    console.log(`💰 Custom price set: ${symbolUpper} = $${price}`);
  }

  /**
   * Remove custom price
   * @param {string} symbol - Token symbol
   */
  removeCustomPrice(symbol) {
    const symbolUpper = symbol.toUpperCase();
    this.customPrices.delete(symbolUpper);
    this.saveCustomPrices();
    console.log(`🗑️ Custom price removed: ${symbolUpper}`);
  }

  /**
   * Get custom price
   * @param {string} symbol - Token symbol
   * @returns {number|null} Custom price or null
   */
  getCustomPrice(symbol) {
    return this.customPrices.get(symbol.toUpperCase()) || null;
  }

  /**
   * Check if token has custom price
   * @param {string} symbol - Token symbol
   * @returns {boolean} True if custom price exists
   */
  hasCustomPrice(symbol) {
    return this.customPrices.has(symbol.toUpperCase());
  }

  /**
   * Save custom prices to localStorage
   */
  saveCustomPrices() {
    const data = Object.fromEntries(this.customPrices);
    localStorage.setItem(APP_CONFIG.storageKeys.customPrices, JSON.stringify(data));
  }

  /**
   * Load custom prices from localStorage
   */
  loadCustomPrices() {
    try {
      const stored = localStorage.getItem(APP_CONFIG.storageKeys.customPrices);
      if (stored) {
        const data = JSON.parse(stored);
        this.customPrices = new Map(Object.entries(data));
        console.log(`📂 Loaded ${this.customPrices.size} custom prices`);
      }
    } catch (error) {
      console.error('Error loading custom prices:', error);
    }
  }

  /**
   * Start auto-update
   * @param {number} interval - Update interval in ms
   */
  startAutoUpdate(interval = 30000) {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      console.log('🔄 Auto-updating prices...');
      // Prices will be updated on next getPrice() call
      this.lastUpdate = Date.now();
    }, interval);
  }

  /**
   * Stop auto-update
   */
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.prices.clear();
    console.log('🗑️ Price cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      cachedPrices: this.prices.size,
      customPrices: this.customPrices.size,
      lastUpdate: this.lastUpdate
    };
  }
}

// Export singleton instance
export const priceService = new PriceService();
