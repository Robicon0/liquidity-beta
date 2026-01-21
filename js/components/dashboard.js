/**
 * Dashboard Component
 * Renders main dashboard with portfolio overview
 */

import { formatCurrency, formatPercent, formatNumber, getChangeClass, getChangeIcon } from '../utils/formatters.js';
import { pnlCalculator } from '../services/pnlCalculator.js';

export class Dashboard {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.metrics = null;
  }

  /**
   * Render dashboard with portfolio metrics
   * @param {Array} positions - All LP positions
   */
  render(positions) {
    if (!this.container) return;

    // Calculate portfolio metrics
    this.metrics = pnlCalculator.calculatePortfolioMetrics(positions);

    this.container.innerHTML = `
      <div class="dashboard">
        <!-- Portfolio Overview -->
        <div class="dashboard-overview">
          <div class="overview-card main-card">
            <div class="card-label">Total Portfolio Value</div>
            <div class="card-value-large">${formatCurrency(this.metrics.totalValue)}</div>
            <div class="card-change ${getChangeClass(this.metrics.totalPnL)}">
              ${getChangeIcon(this.metrics.totalPnL)}
              ${formatCurrency(Math.abs(this.metrics.totalPnL))}
              (${formatPercent(this.metrics.totalPnLPercent)})
            </div>
          </div>

          <div class="overview-card">
            <div class="card-label">Initial Investment</div>
            <div class="card-value">${formatCurrency(this.metrics.totalInitialInvestment)}</div>
          </div>

          <div class="overview-card">
            <div class="card-label">Total PnL</div>
            <div class="card-value ${getChangeClass(this.metrics.totalPnL)}">
              ${formatCurrency(this.metrics.totalPnL)}
            </div>
            <div class="card-sublabel ${getChangeClass(this.metrics.totalPnLPercent)}">
              ${formatPercent(this.metrics.totalPnLPercent)}
            </div>
          </div>

          <div class="overview-card">
            <div class="card-label">Fees Earned</div>
            <div class="card-value success">${formatCurrency(this.metrics.totalFeesEarned)}</div>
          </div>

          <div class="overview-card">
            <div class="card-label">Impermanent Loss</div>
            <div class="card-value ${getChangeClass(this.metrics.totalImpermanentLoss)}">
              ${formatCurrency(Math.abs(this.metrics.totalImpermanentLoss))}
            </div>
          </div>

          <div class="overview-card">
            <div class="card-label">Active Positions</div>
            <div class="card-value">${this.metrics.activePositions}</div>
            <div class="card-sublabel">${this.metrics.closedPositions} closed</div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="quick-stats">
          <div class="stat-item">
            <div class="stat-icon">🏆</div>
            <div class="stat-content">
              <div class="stat-label">Best Performer</div>
              <div class="stat-value">
                ${this.metrics.bestPerformer ?
                  `${this.metrics.bestPerformer.tokenPair.displayName} (${formatPercent(this.metrics.bestPerformer.pnlPercent)})` :
                  '—'}
              </div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon">📉</div>
            <div class="stat-content">
              <div class="stat-label">Worst Performer</div>
              <div class="stat-value">
                ${this.metrics.worstPerformer ?
                  `${this.metrics.worstPerformer.tokenPair.displayName} (${formatPercent(this.metrics.worstPerformer.pnlPercent)})` :
                  '—'}
              </div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon">⛓️</div>
            <div class="stat-content">
              <div class="stat-label">Chains</div>
              <div class="stat-value">${this.getUniqueChains(positions).length} chains</div>
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-icon">🔄</div>
            <div class="stat-content">
              <div class="stat-label">Protocols</div>
              <div class="stat-value">${this.getUniqueProtocols(positions).length} protocols</div>
            </div>
          </div>
        </div>

        <!-- Position Breakdown by Protocol -->
        ${this.renderProtocolBreakdown(positions)}

        <!-- Position Breakdown by Chain -->
        ${this.renderChainBreakdown(positions)}
      </div>
    `;
  }

  /**
   * Render protocol breakdown
   * @param {Array} positions - All positions
   * @returns {string} HTML
   */
  renderProtocolBreakdown(positions) {
    const byProtocol = {};

    positions.forEach(pos => {
      const protocolName = pos.protocol?.name || 'Unknown';
      if (!byProtocol[protocolName]) {
        byProtocol[protocolName] = {
          name: protocolName,
          logo: pos.protocol?.logo || '🔄',
          count: 0,
          totalValue: 0,
          totalPnL: 0
        };
      }

      byProtocol[protocolName].count++;
      byProtocol[protocolName].totalValue += pos.currentValue || 0;
      byProtocol[protocolName].totalPnL += pos.pnl || 0;
    });

    const protocols = Object.values(byProtocol).sort((a, b) => b.totalValue - a.totalValue);

    return `
      <div class="breakdown-section">
        <h3 class="section-title">By Protocol</h3>
        <div class="breakdown-grid">
          ${protocols.map(protocol => `
            <div class="breakdown-card">
              <div class="breakdown-header">
                <span class="breakdown-icon">${protocol.logo}</span>
                <span class="breakdown-name">${protocol.name}</span>
              </div>
              <div class="breakdown-stats">
                <div class="breakdown-stat">
                  <div class="breakdown-stat-label">Value</div>
                  <div class="breakdown-stat-value">${formatCurrency(protocol.totalValue)}</div>
                </div>
                <div class="breakdown-stat">
                  <div class="breakdown-stat-label">PnL</div>
                  <div class="breakdown-stat-value ${getChangeClass(protocol.totalPnL)}">
                    ${formatCurrency(protocol.totalPnL)}
                  </div>
                </div>
                <div class="breakdown-stat">
                  <div class="breakdown-stat-label">Positions</div>
                  <div class="breakdown-stat-value">${protocol.count}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render chain breakdown
   * @param {Array} positions - All positions
   * @returns {string} HTML
   */
  renderChainBreakdown(positions) {
    const byChain = {};

    positions.forEach(pos => {
      const chain = pos.chain || 'Unknown';
      if (!byChain[chain]) {
        byChain[chain] = {
          name: chain,
          icon: pos.chainIcon || '⛓️',
          count: 0,
          totalValue: 0,
          totalPnL: 0
        };
      }

      byChain[chain].count++;
      byChain[chain].totalValue += pos.currentValue || 0;
      byChain[chain].totalPnL += pos.pnl || 0;
    });

    const chains = Object.values(byChain).sort((a, b) => b.totalValue - a.totalValue);

    return `
      <div class="breakdown-section">
        <h3 class="section-title">By Chain</h3>
        <div class="breakdown-grid">
          ${chains.map(chain => `
            <div class="breakdown-card">
              <div class="breakdown-header">
                <span class="breakdown-icon">${chain.icon}</span>
                <span class="breakdown-name">${chain.name}</span>
              </div>
              <div class="breakdown-stats">
                <div class="breakdown-stat">
                  <div class="breakdown-stat-label">Value</div>
                  <div class="breakdown-stat-value">${formatCurrency(chain.totalValue)}</div>
                </div>
                <div class="breakdown-stat">
                  <div class="breakdown-stat-label">PnL</div>
                  <div class="breakdown-stat-value ${getChangeClass(chain.totalPnL)}">
                    ${formatCurrency(chain.totalPnL)}
                  </div>
                </div>
                <div class="breakdown-stat">
                  <div class="breakdown-stat-label">Positions</div>
                  <div class="breakdown-stat-value">${chain.count}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Get unique chains
   * @param {Array} positions - All positions
   * @returns {Array} Unique chain names
   */
  getUniqueChains(positions) {
    return [...new Set(positions.map(p => p.chain))];
  }

  /**
   * Get unique protocols
   * @param {Array} positions - All positions
   * @returns {Array} Unique protocol names
   */
  getUniqueProtocols(positions) {
    return [...new Set(positions.map(p => p.protocol?.name).filter(Boolean))];
  }

  /**
   * Show empty state
   */
  showEmpty() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>No LP Positions Found</h3>
        <p>Connect your wallet or try a different chain to view your liquidity positions.</p>
      </div>
    `;
  }

  /**
   * Show loading state
   */
  showLoading() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    `;
  }
}
