/**
 * LP Detection Engine
 * Analyzes blockchain data to identify and reconstruct LP positions
 */

import { PROTOCOLS, LP_EVENT_SIGNATURES, matchProtocolContract } from '../config/protocols.js';
import { TX_TYPES, POSITION_STATUS } from '../config/constants.js';

class LPDetector {
  constructor() {
    this.positions = new Map();
    this.lpTransactions = [];
  }

  /**
   * Analyze all chain data to detect LP positions
   * @param {Object} chainData - Data from blockchain service
   * @param {string} userAddress - User's wallet address
   * @returns {Object} Detected positions and transactions
   */
  async analyzeChainData(chainData, userAddress) {
    console.log('🔍 Analyzing chain data for LP positions...');

    const allPositions = [];
    const allLPTransactions = [];

    for (const [chainKey, data] of Object.entries(chainData)) {
      console.log(`  ⛓️ Analyzing ${data.chain.name}...`);

      // Analyze token transfers for LP tokens
      const lpTokens = this.detectLPTokens(data.tokenTransfers, userAddress);

      // Analyze transactions for LP-related actions
      const lpActions = this.detectLPActions(data.transactions, userAddress, data.chain.name);

      // Combine token transfers and transactions to build positions
      const positions = this.buildPositions(lpTokens, lpActions, data.chain);

      allPositions.push(...positions);
      allLPTransactions.push(...lpActions);

      console.log(`    Found ${positions.length} LP positions`);
    }

    console.log(`✅ Total LP positions found: ${allPositions.length}`);

    return {
      positions: allPositions,
      transactions: allLPTransactions
    };
  }

  /**
   * Detect LP tokens from token transfers
   * @param {Array} tokenTransfers - Token transfer transactions
   * @param {string} userAddress - User's wallet address
   * @returns {Array} LP tokens
   */
  detectLPTokens(tokenTransfers, userAddress) {
    const lpTokens = new Map();
    const userAddr = userAddress.toLowerCase();

    tokenTransfers.forEach(transfer => {
      const tokenSymbol = transfer.tokenSymbol || '';
      const tokenName = transfer.tokenName || '';

      // Check if it's an LP token based on naming
      const isLPToken = this.isLikelyLPToken(tokenSymbol, tokenName);

      if (isLPToken) {
        const contractAddr = transfer.contractAddress.toLowerCase();
        const isReceiving = transfer.to.toLowerCase() === userAddr;
        const isSending = transfer.from.toLowerCase() === userAddr;

        if (!lpTokens.has(contractAddr)) {
          lpTokens.set(contractAddr, {
            contractAddress: contractAddr,
            symbol: tokenSymbol,
            name: tokenName,
            decimals: parseInt(transfer.tokenDecimal) || 18,
            balance: 0,
            transactions: []
          });
        }

        const token = lpTokens.get(contractAddr);
        const value = parseFloat(transfer.value) / Math.pow(10, token.decimals);

        if (isReceiving) {
          token.balance += value;
        } else if (isSending) {
          token.balance -= value;
        }

        token.transactions.push({
          ...transfer,
          type: isReceiving ? 'receive' : 'send',
          value: value
        });
      }
    });

    return Array.from(lpTokens.values());
  }

  /**
   * Check if token is likely an LP token
   * @param {string} symbol - Token symbol
   * @param {string} name - Token name
   * @returns {boolean} True if likely LP token
   */
  isLikelyLPToken(symbol, name) {
    const lpIndicators = [
      'UNI-V2', 'UNI-V3', 'SLP', 'CAKE-LP', 'BPT',
      'CRV', '3Crv', 'crvUSD',
      '-LP', 'LP-', 'Balancer', 'Curve',
      'Uniswap V2', 'Uniswap V3', 'SushiSwap',
      'PancakeSwap', 'Aerodrome'
    ];

    const combinedText = `${symbol} ${name}`.toUpperCase();

    return lpIndicators.some(indicator =>
      combinedText.includes(indicator.toUpperCase())
    );
  }

  /**
   * Detect LP-related actions from transactions
   * @param {Array} transactions - Regular transactions
   * @param {string} userAddress - User's wallet address
   * @param {string} chainName - Chain name
   * @returns {Array} LP actions
   */
  detectLPActions(transactions, userAddress, chainName) {
    const lpActions = [];
    const userAddr = userAddress.toLowerCase();

    transactions.forEach(tx => {
      const toAddr = (tx.to || '').toLowerCase();
      const fromAddr = (tx.from || '').toLowerCase();

      // Check if transaction is with a known protocol
      const protocol = matchProtocolContract(toAddr, chainName);

      if (protocol) {
        // Classify transaction type based on function called
        const txType = this.classifyTransaction(tx, protocol);

        if (txType !== TX_TYPES.UNKNOWN) {
          lpActions.push({
            ...tx,
            txType,
            protocol: protocol.name,
            protocolKey: protocol.protocolKey,
            chainName,
            timestamp: parseInt(tx.timeStamp),
            value: parseFloat(tx.value) / 1e18,
            gasUsed: parseInt(tx.gasUsed),
            gasPrice: parseFloat(tx.gasPrice) / 1e9 // Gwei
          });
        }
      }
    });

    return lpActions;
  }

  /**
   * Classify transaction type
   * @param {Object} tx - Transaction
   * @param {Object} protocol - Protocol info
   * @returns {string} Transaction type
   */
  classifyTransaction(tx, protocol) {
    const input = tx.input || '';
    const methodId = input.substring(0, 10).toLowerCase();

    // Common method IDs for LP operations
    const methodSignatures = {
      // Add liquidity
      '0xe8e33700': TX_TYPES.ADD_LIQUIDITY,  // addLiquidity
      '0xf305d719': TX_TYPES.ADD_LIQUIDITY,  // addLiquidityETH
      '0x4515cef3': TX_TYPES.ADD_LIQUIDITY,  // addLiquidityAVAX
      '0x0b4c7e4d': TX_TYPES.ADD_LIQUIDITY,  // add_liquidity (Curve)

      // Remove liquidity
      '0xbaa2abde': TX_TYPES.REMOVE_LIQUIDITY,  // removeLiquidity
      '0x02751cec': TX_TYPES.REMOVE_LIQUIDITY,  // removeLiquidityETH
      '0x5b0d5984': TX_TYPES.REMOVE_LIQUIDITY,  // removeLiquidityAVAX
      '0x1a4d01d2': TX_TYPES.REMOVE_LIQUIDITY,  // remove_liquidity (Curve)

      // Uniswap V3 specific
      '0x88316456': TX_TYPES.ADD_LIQUIDITY,  // mint (V3)
      '0x0c49ccbe': TX_TYPES.REMOVE_LIQUIDITY,  // decreaseLiquidity (V3)
      '0xfc6f7865': TX_TYPES.COLLECT_FEES,  // collect (V3)

      // Swaps (for reference)
      '0x38ed1739': TX_TYPES.SWAP,  // swapExactTokensForTokens
      '0x7ff36ab5': TX_TYPES.SWAP,  // swapExactETHForTokens
      '0x18cbafe5': TX_TYPES.SWAP   // swapExactTokensForETH
    };

    return methodSignatures[methodId] || TX_TYPES.UNKNOWN;
  }

  /**
   * Build complete position objects from LP tokens and actions
   * @param {Array} lpTokens - Detected LP tokens
   * @param {Array} lpActions - LP-related transactions
   * @param {Object} chain - Chain configuration
   * @returns {Array} Complete positions
   */
  buildPositions(lpTokens, lpActions, chain) {
    const positions = [];

    lpTokens.forEach(token => {
      // Find related transactions
      const relatedActions = lpActions.filter(action => {
        // Match by timestamp proximity or contract interaction
        return token.transactions.some(tt =>
          Math.abs(tt.timeStamp - action.timeStamp) < 60 // Within 60 seconds
        );
      });

      // Calculate position metrics
      const addLiquidityActions = relatedActions.filter(a => a.txType === TX_TYPES.ADD_LIQUIDITY);
      const removeLiquidityActions = relatedActions.filter(a => a.txType === TX_TYPES.REMOVE_LIQUIDITY);
      const feeCollections = relatedActions.filter(a => a.txType === TX_TYPES.COLLECT_FEES);

      // Determine position status
      let status = POSITION_STATUS.ACTIVE;
      if (token.balance < 0.000001) {
        status = POSITION_STATUS.CLOSED;
      } else if (removeLiquidityActions.length > 0 && token.balance > 0) {
        status = POSITION_STATUS.PARTIAL;
      }

      // Extract token pair from name
      const tokenPair = this.extractTokenPair(token.name, token.symbol);

      // Create position object
      positions.push({
        id: `${chain.name}_${token.contractAddress}`,
        contractAddress: token.contractAddress,
        lpToken: {
          symbol: token.symbol,
          name: token.name,
          balance: token.balance,
          decimals: token.decimals
        },
        tokenPair,
        protocol: this.detectProtocolFromName(token.name, token.symbol),
        chain: chain.name,
        chainIcon: chain.icon,
        status,
        currentBalance: token.balance,
        actions: {
          adds: addLiquidityActions.length,
          removes: removeLiquidityActions.length,
          feeCollections: feeCollections.length
        },
        transactions: relatedActions,
        firstInteraction: relatedActions.length > 0
          ? Math.min(...relatedActions.map(a => a.timestamp))
          : null,
        lastInteraction: relatedActions.length > 0
          ? Math.max(...relatedActions.map(a => a.timestamp))
          : null,
        // These will be populated by PnL calculator
        initialValue: 0,
        currentValue: 0,
        pnl: 0,
        pnlPercent: 0,
        feesEarned: 0,
        impermanentLoss: 0
      });
    });

    return positions;
  }

  /**
   * Extract token pair from LP token name
   * @param {string} name - Token name
   * @param {string} symbol - Token symbol
   * @returns {Object} Token pair info
   */
  extractTokenPair(name, symbol) {
    // Try to parse from symbol first (e.g., "UNI-V2" or "USDC-ETH")
    const symbolParts = symbol.split('-').filter(p => p && !p.includes('V2') && !p.includes('V3') && !p.includes('LP'));

    if (symbolParts.length >= 2) {
      return {
        token0: symbolParts[0],
        token1: symbolParts[1],
        displayName: `${symbolParts[0]}/${symbolParts[1]}`
      };
    }

    // Try to parse from name
    const nameParts = name.split(' ');
    const tokens = nameParts.filter(p => p.length <= 6 && p.toUpperCase() === p);

    if (tokens.length >= 2) {
      return {
        token0: tokens[0],
        token1: tokens[1],
        displayName: `${tokens[0]}/${${tokens[1]}`
      };
    }

    // Fallback
    return {
      token0: 'Token0',
      token1: 'Token1',
      displayName: symbol
    };
  }

  /**
   * Detect protocol from token name/symbol
   * @param {string} name - Token name
   * @param {string} symbol - Token symbol
   * @returns {Object} Protocol info
   */
  detectProtocolFromName(name, symbol) {
    const text = `${name} ${symbol}`.toLowerCase();

    if (text.includes('uniswap v3') || text.includes('uni-v3')) {
      return { key: 'uniswapV3', ...PROTOCOLS.uniswapV3 };
    }
    if (text.includes('uniswap') || text.includes('uni-v2')) {
      return { key: 'uniswapV2', ...PROTOCOLS.uniswapV2 };
    }
    if (text.includes('sushi')) {
      return { key: 'sushiswap', ...PROTOCOLS.sushiswap };
    }
    if (text.includes('curve') || text.includes('crv')) {
      return { key: 'curve', ...PROTOCOLS.curve };
    }
    if (text.includes('balancer') || text.includes('bpt')) {
      return { key: 'balancerV2', ...PROTOCOLS.balancerV2 };
    }
    if (text.includes('pancake') || text.includes('cake')) {
      return { key: 'pancakeswap', ...PROTOCOLS.pancakeswap };
    }
    if (text.includes('aerodrome')) {
      return { key: 'aerodrome', ...PROTOCOLS.aerodrome };
    }

    return { key: 'unknown', name: 'Unknown DEX', logo: '🔄', color: '#888888' };
  }

  /**
   * Get all detected positions
   * @returns {Array} All positions
   */
  getPositions() {
    return Array.from(this.positions.values());
  }

  /**
   * Get active positions only
   * @returns {Array} Active positions
   */
  getActivePositions() {
    return this.getPositions().filter(p => p.status === POSITION_STATUS.ACTIVE);
  }

  /**
   * Get position by ID
   * @param {string} id - Position ID
   * @returns {Object|null} Position or null
   */
  getPosition(id) {
    return this.positions.get(id) || null;
  }
}

// Export singleton instance
export const lpDetector = new LPDetector();
