/**
 * PnL Calculator
 * Calculates profit/loss, fees, and impermanent loss for LP positions
 */

import { priceService } from './priceService.js';
import { TX_TYPES } from '../config/constants.js';

class PnLCalculator {
  constructor() {
    this.calculations = new Map();
  }

  /**
   * Calculate complete PnL for a position
   * @param {Object} position - LP position
   * @returns {Promise<Object>} Updated position with PnL data
   */
  async calculatePositionPnL(position) {
    console.log(`💰 Calculating PnL for ${position.tokenPair.displayName}...`);

    try {
      // Get current token prices
      const token0Price = await priceService.getPrice(position.tokenPair.token0);
      const token1Price = await priceService.getPrice(position.tokenPair.token1);

      // Calculate initial investment from add liquidity transactions
      const initialData = await this.calculateInitialInvestment(
        position.transactions,
        position.tokenPair
      );

      // Calculate current value
      const currentValue = await this.calculateCurrentValue(
        position.lpToken.balance,
        position.tokenPair,
        token0Price,
        token1Price
      );

      // Calculate fees earned
      const feesEarned = await this.calculateFeesEarned(position.transactions);

      // Calculate impermanent loss
      const impermanentLoss = this.calculateImpermanentLoss(
        initialData.initialPrices,
        { token0: token0Price, token1: token1Price },
        initialData.initialAmounts
      );

      // Calculate total PnL
      const totalPnL = currentValue + feesEarned - initialData.initialValue;
      const pnlPercent = initialData.initialValue > 0
        ? (totalPnL / initialData.initialValue) * 100
        : 0;

      // Calculate APY if position has been open long enough
      const apy = this.calculateAPY(
        initialData.initialValue,
        currentValue + feesEarned,
        position.firstInteraction,
        position.lastInteraction
      );

      // Update position object
      return {
        ...position,
        initialValue: initialData.initialValue,
        currentValue,
        pnl: totalPnL,
        pnlPercent,
        feesEarned,
        impermanentLoss,
        impermanentLossPercent: impermanentLoss.percent,
        apy,
        tokenPrices: {
          token0: token0Price,
          token1: token1Price
        },
        tokenAmounts: {
          initial: initialData.initialAmounts,
          current: await this.estimateCurrentTokenAmounts(
            position.lpToken.balance,
            position.tokenPair
          )
        }
      };

    } catch (error) {
      console.error(`Error calculating PnL for position ${position.id}:`, error);
      return position;
    }
  }

  /**
   * Calculate initial investment from add liquidity transactions
   * @param {Array} transactions - Position transactions
   * @param {Object} tokenPair - Token pair info
   * @returns {Promise<Object>} Initial investment data
   */
  async calculateInitialInvestment(transactions, tokenPair) {
    const addTxs = transactions.filter(tx => tx.txType === TX_TYPES.ADD_LIQUIDITY);

    if (addTxs.length === 0) {
      return {
        initialValue: 0,
        initialAmounts: { token0: 0, token1: 0 },
        initialPrices: { token0: 0, token1: 0 }
      };
    }

    // Use the first add liquidity transaction to estimate initial amounts
    const firstAdd = addTxs[0];
    const timestamp = firstAdd.timestamp * 1000;

    // For simplicity, we'll use current prices as a proxy
    // In production, you'd fetch historical prices
    const token0Price = await priceService.getPrice(tokenPair.token0);
    const token1Price = await priceService.getPrice(tokenPair.token1);

    // Estimate token amounts from ETH value sent
    // This is a simplified calculation
    const ethValue = firstAdd.value;
    const estimatedValue = ethValue * (await priceService.getPrice('ETH'));

    // Assume 50/50 split for most AMM pools
    const token0Amount = (estimatedValue / 2) / token0Price;
    const token1Amount = (estimatedValue / 2) / token1Price;

    // Sum all add liquidity transactions
    let totalValue = 0;
    for (const tx of addTxs) {
      const ethVal = tx.value;
      const ethPrice = await priceService.getPrice('ETH');
      totalValue += ethVal * ethPrice;
    }

    return {
      initialValue: totalValue || estimatedValue,
      initialAmounts: {
        token0: token0Amount,
        token1: token1Amount
      },
      initialPrices: {
        token0: token0Price,
        token1: token1Price
      }
    };
  }

  /**
   * Calculate current value of LP position
   * @param {number} lpBalance - LP token balance
   * @param {Object} tokenPair - Token pair info
   * @param {number} token0Price - Token 0 price
   * @param {number} token1Price - Token 1 price
   * @returns {Promise<number>} Current value in USD
   */
  async calculateCurrentValue(lpBalance, tokenPair, token0Price, token1Price) {
    if (lpBalance === 0) return 0;

    // Simplified calculation
    // In production, you would need to:
    // 1. Get pool reserves
    // 2. Get total LP supply
    // 3. Calculate pro-rata share

    // For now, use a proxy estimation
    // This will be replaced with actual pool data fetching
    const estimatedToken0 = lpBalance * 100; // Placeholder
    const estimatedToken1 = lpBalance * 100; // Placeholder

    return (estimatedToken0 * token0Price) + (estimatedToken1 * token1Price);
  }

  /**
   * Estimate current token amounts in position
   * @param {number} lpBalance - LP token balance
   * @param {Object} tokenPair - Token pair info
   * @returns {Promise<Object>} Estimated token amounts
   */
  async estimateCurrentTokenAmounts(lpBalance, tokenPair) {
    // Simplified - in production, fetch actual pool data
    return {
      token0: lpBalance * 100,
      token1: lpBalance * 100
    };
  }

  /**
   * Calculate fees earned from fee collection transactions
   * @param {Array} transactions - Position transactions
   * @returns {Promise<number>} Total fees earned in USD
   */
  async calculateFeesEarned(transactions) {
    const feeTxs = transactions.filter(tx => tx.txType === TX_TYPES.COLLECT_FEES);

    if (feeTxs.length === 0) {
      // Estimate fees for V2 pools (they auto-compound)
      // Simplified: 0.3% fee on volume, estimate 5% of position value
      return 0; // Will be calculated when we have actual pool data
    }

    // Sum up fee collection transactions
    let totalFees = 0;
    const ethPrice = await priceService.getPrice('ETH');

    for (const tx of feeTxs) {
      // This is simplified - actual fee amounts would be parsed from logs
      totalFees += tx.value * ethPrice;
    }

    return totalFees;
  }

  /**
   * Calculate impermanent loss
   * @param {Object} initialPrices - Initial token prices
   * @param {Object} currentPrices - Current token prices
   * @param {Object} initialAmounts - Initial token amounts
   * @returns {Object} Impermanent loss data
   */
  calculateImpermanentLoss(initialPrices, currentPrices, initialAmounts) {
    const { token0: p0_initial, token1: p1_initial } = initialPrices;
    const { token0: p0_current, token1: p1_current } = currentPrices;
    const { token0: amount0, token1: amount1 } = initialAmounts;

    if (p0_initial === 0 || p1_initial === 0) {
      return { value: 0, percent: 0 };
    }

    // Calculate price ratio change
    const priceRatioInitial = p0_initial / p1_initial;
    const priceRatioCurrent = p0_current / p1_current;
    const priceRatioChange = priceRatioCurrent / priceRatioInitial;

    // Calculate value if held outside LP
    const holdValue = (amount0 * p0_current) + (amount1 * p1_current);

    // Calculate value in LP (with rebalancing)
    // Using the impermanent loss formula: 2 * sqrt(ratio) / (1 + ratio) - 1
    const k = Math.sqrt(priceRatioChange);
    const ilMultiplier = (2 * k) / (1 + priceRatioChange);

    const initialValue = (amount0 * p0_initial) + (amount1 * p1_initial);
    const lpValue = initialValue * ilMultiplier;

    // Impermanent loss
    const ilValue = lpValue - holdValue;
    const ilPercent = (ilValue / holdValue) * 100;

    return {
      value: ilValue,
      percent: ilPercent,
      holdValue,
      lpValue
    };
  }

  /**
   * Calculate APY
   * @param {number} initialValue - Initial investment
   * @param {number} currentValue - Current value
   * @param {number} startTimestamp - Position start timestamp
   * @param {number} endTimestamp - Position end timestamp
   * @returns {number} APY percentage
   */
  calculateAPY(initialValue, currentValue, startTimestamp, endTimestamp) {
    if (!startTimestamp || !endTimestamp || initialValue === 0) {
      return 0;
    }

    const durationSeconds = endTimestamp - startTimestamp;
    const durationYears = durationSeconds / (365.25 * 24 * 60 * 60);

    if (durationYears === 0) return 0;

    const returnMultiple = currentValue / initialValue;
    const apy = (Math.pow(returnMultiple, 1 / durationYears) - 1) * 100;

    return apy;
  }

  /**
   * Calculate portfolio-wide metrics
   * @param {Array} positions - All positions
   * @returns {Object} Portfolio metrics
   */
  calculatePortfolioMetrics(positions) {
    const metrics = {
      totalValue: 0,
      totalInitialInvestment: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      totalFeesEarned: 0,
      totalImpermanentLoss: 0,
      activePositions: 0,
      closedPositions: 0,
      bestPerformer: null,
      worstPerformer: null
    };

    if (!positions || positions.length === 0) {
      return metrics;
    }

    // Calculate totals
    positions.forEach(position => {
      metrics.totalValue += position.currentValue || 0;
      metrics.totalInitialInvestment += position.initialValue || 0;
      metrics.totalPnL += position.pnl || 0;
      metrics.totalFeesEarned += position.feesEarned || 0;
      metrics.totalImpermanentLoss += (position.impermanentLoss?.value || 0);

      if (position.status === 'active') {
        metrics.activePositions++;
      } else if (position.status === 'closed') {
        metrics.closedPositions++;
      }

      // Track best/worst performers
      if (!metrics.bestPerformer || (position.pnlPercent > metrics.bestPerformer.pnlPercent)) {
        metrics.bestPerformer = position;
      }
      if (!metrics.worstPerformer || (position.pnlPercent < metrics.worstPerformer.pnlPercent)) {
        metrics.worstPerformer = position;
      }
    });

    // Calculate total PnL percent
    if (metrics.totalInitialInvestment > 0) {
      metrics.totalPnLPercent = (metrics.totalPnL / metrics.totalInitialInvestment) * 100;
    }

    return metrics;
  }

  /**
   * Calculate all positions PnL
   * @param {Array} positions - All positions
   * @returns {Promise<Array>} Positions with PnL data
   */
  async calculateAllPositions(positions) {
    console.log(`💰 Calculating PnL for ${positions.length} positions...`);

    const updatedPositions = await Promise.all(
      positions.map(position => this.calculatePositionPnL(position))
    );

    console.log('✅ All PnL calculations complete');
    return updatedPositions;
  }
}

// Export singleton instance
export const pnlCalculator = new PnLCalculator();
