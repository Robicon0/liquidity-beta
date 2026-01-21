/**
 * LP Positions Table Component
 * Displays detailed LP positions with editable fields
 */

import { formatCurrency, formatPercent, formatDate, formatAddress, formatTokenAmount, getChangeClass } from '../utils/formatters.js';
import { getExplorerAddressUrl } from '../utils/helpers.js';
import { editableData } from '../utils/storage.js';

export class LPPositionsTable {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.positions = [];
    this.filter = 'all'; // all, active, closed
    this.sortBy = 'currentValue';
    this.sortDirection = 'desc';
  }

  /**
   * Render positions table
   * @param {Array} positions - LP positions
   */
  render(positions) {
    this.positions = positions;
    if (!this.container) return;

    const filtered = this.filterPositions(positions);
    const sorted = this.sortPositions(filtered);

    this.container.innerHTML = `
      <div class="positions-table">
        <!-- Table Controls -->
        <div class="table-controls">
          <div class="table-filters">
            <button class="filter-btn ${this.filter === 'all' ? 'active' : ''}" data-filter="all">
              All (${positions.length})
            </button>
            <button class="filter-btn ${this.filter === 'active' ? 'active' : ''}" data-filter="active">
              Active (${positions.filter(p => p.status === 'active').length})
            </button>
            <button class="filter-btn ${this.filter === 'closed' ? 'active' : ''}" data-filter="closed">
              Closed (${positions.filter(p => p.status === 'closed').length})
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="table-wrapper">
          <table class="lp-table">
            <thead>
              <tr>
                <th>Position</th>
                <th>Protocol</th>
                <th>Chain</th>
                <th class="sortable" data-sort="currentValue">Current Value</th>
                <th class="sortable" data-sort="initialValue">Initial Investment</th>
                <th class="sortable" data-sort="pnl">PnL</th>
                <th class="sortable" data-sort="feesEarned">Fees Earned</th>
                <th>IL</th>
                <th>APY</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${sorted.length === 0 ?
                `<tr><td colspan="11" class="empty-row">No positions found</td></tr>` :
                sorted.map(pos => this.renderPositionRow(pos)).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Render individual position row
   * @param {Object} position - Position data
   * @returns {string} HTML
   */
  renderPositionRow(position) {
    const note = editableData.getNote(position.id);

    return `
      <tr class="position-row" data-position-id="${position.id}">
        <td>
          <div class="position-info">
            <div class="position-pair">${position.tokenPair.displayName}</div>
            <div class="position-details">
              ${formatTokenAmount(position.lpToken.balance, 4)} LP
              ${note ? `<span class="note-indicator" title="${note}">📝</span>` : ''}
            </div>
          </div>
        </td>
        <td>
          <div class="protocol-cell">
            <span class="protocol-icon">${position.protocol?.logo || '🔄'}</span>
            ${position.protocol?.name || 'Unknown'}
          </div>
        </td>
        <td>
          <div class="chain-cell">
            <span class="chain-icon">${position.chainIcon || '⛓️'}</span>
            ${position.chain}
          </div>
        </td>
        <td class="value-cell">
          ${formatCurrency(position.currentValue || 0)}
        </td>
        <td class="value-cell">
          ${formatCurrency(position.initialValue || 0)}
        </td>
        <td class="value-cell ${getChangeClass(position.pnl)}">
          <div>${formatCurrency(position.pnl || 0)}</div>
          <div class="sublabel">${formatPercent(position.pnlPercent || 0)}</div>
        </td>
        <td class="value-cell success">
          ${formatCurrency(position.feesEarned || 0)}
        </td>
        <td class="value-cell ${getChangeClass(position.impermanentLoss?.value)}">
          ${formatCurrency(Math.abs(position.impermanentLoss?.value || 0))}
        </td>
        <td class="value-cell ${getChangeClass(position.apy)}">
          ${position.apy ? formatPercent(position.apy, 2, false) : '—'}
        </td>
        <td>
          <span class="status-badge status-${position.status}">${position.status}</span>
        </td>
        <td>
          <div class="action-buttons">
            <button class="action-btn" data-action="edit" title="Edit">✏️</button>
            <button class="action-btn" data-action="view" title="View Details">👁️</button>
          </div>
        </td>
      </tr>
    `;
  }

  /**
   * Filter positions
   * @param {Array} positions - All positions
   * @returns {Array} Filtered positions
   */
  filterPositions(positions) {
    if (this.filter === 'all') return positions;
    return positions.filter(p => p.status === this.filter);
  }

  /**
   * Sort positions
   * @param {Array} positions - Positions to sort
   * @returns {Array} Sorted positions
   */
  sortPositions(positions) {
    return [...positions].sort((a, b) => {
      const aVal = a[this.sortBy] || 0;
      const bVal = b[this.sortBy] || 0;

      if (this.sortDirection === 'asc') {
        return aVal - bVal;
      }
      return bVal - aVal;
    });
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Filter buttons
    this.container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.filter = e.target.dataset.filter;
        this.render(this.positions);
      });
    });

    // Sort headers
    this.container.querySelectorAll('.sortable').forEach(th => {
      th.addEventListener('click', (e) => {
        const sortKey = e.target.dataset.sort;
        if (this.sortBy === sortKey) {
          this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortBy = sortKey;
          this.sortDirection = 'desc';
        }
        this.render(this.positions);
      });
    });

    // Action buttons
    this.container.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const row = e.target.closest('.position-row');
        const positionId = row.dataset.positionId;
        const position = this.positions.find(p => p.id === positionId);

        if (action === 'edit') {
          this.showEditModal(position);
        } else if (action === 'view') {
          this.showDetailsModal(position);
        }
      });
    });
  }

  /**
   * Show edit modal (simplified)
   * @param {Object} position - Position to edit
   */
  showEditModal(position) {
    const note = editableData.getNote(position.id) || '';
    const newNote = prompt(`Edit note for ${position.tokenPair.displayName}:`, note);

    if (newNote !== null) {
      editableData.setNote(position.id, newNote);
      this.render(this.positions);
    }
  }

  /**
   * Show details modal (simplified)
   * @param {Object} position - Position to view
   */
  showDetailsModal(position) {
    alert(`Position Details:\n\n` +
      `Pair: ${position.tokenPair.displayName}\n` +
      `Protocol: ${position.protocol?.name}\n` +
      `Chain: ${position.chain}\n` +
      `Current Value: ${formatCurrency(position.currentValue)}\n` +
      `PnL: ${formatCurrency(position.pnl)} (${formatPercent(position.pnlPercent)})\n` +
      `Fees Earned: ${formatCurrency(position.feesEarned)}\n` +
      `Contract: ${position.contractAddress}`
    );
  }

  /**
   * Show empty state
   */
  showEmpty() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💧</div>
        <h3>No Liquidity Positions</h3>
        <p>We couldn't find any LP positions for this wallet.</p>
      </div>
    `;
  }
}
