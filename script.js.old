console.log("🎯 AutoTrack - DeBank-Style Portfolio Tracker Initialized");

/* ================================
   CHAIN CONFIGURATIONS
================================ */
const CHAINS = {
  ethereum: { 
    id: '0x1', 
    name: 'Ethereum', 
    symbol: 'ETH', 
    api: 'https://api.etherscan.io/api', 
    key: '7985AZCNWY5J9K4PB84WR4APQ4UBAPEPCH',
    icon: '⟠'
  },
  polygon: { 
    id: '0x89', 
    name: 'Polygon', 
    symbol: 'MATIC', 
    api: 'https://api.polygonscan.com/api', 
    key: 'YourPolygonAPIKey',
    icon: '⬡'
  },
  base: { 
    id: '0x2105', 
    name: 'Base', 
    symbol: 'ETH', 
    api: 'https://api.basescan.org/api', 
    key: 'YourBaseAPIKey',
    icon: '🔵'
  },
  arbitrum: { 
    id: '0xa4b1', 
    name: 'Arbitrum', 
    symbol: 'ETH', 
    api: 'https://api.arbiscan.io/api', 
    key: 'YourArbitrumAPIKey',
    icon: '◆'
  },
  optimism: { 
    id: '0xa', 
    name: 'Optimism', 
    symbol: 'ETH', 
    api: 'https://api-optimistic.etherscan.io/api', 
    key: 'YourOptimismAPIKey',
    icon: '○'
  }
};

/* ================================
   PROTOCOL ADAPTERS (Simplified)
   In production, these would be sophisticated backend services
================================ */
const PROTOCOL_ADAPTERS = {
  uniswap: { 
    name: 'Uniswap V2/V3', 
    detect: (tx) => {
      const addr = tx.to?.toLowerCase() || '';
      return addr.includes('uniswap') || addr.includes('0x7a250d5630b4cf539739df2c5dacb4c659f2488d');
    }
  },
  curve: { 
    name: 'Curve Finance', 
    detect: (tx) => tx.to?.toLowerCase().includes('curve')
  },
  aave: { 
    name: 'Aave', 
    detect: (tx) => tx.to?.toLowerCase().includes('aave')
  },
  compound: { 
    name: 'Compound', 
    detect: (tx) => tx.to?.toLowerCase().includes('compound')
  },
  sushiswap: { 
    name: 'SushiSwap', 
    detect: (tx) => tx.to?.toLowerCase().includes('sushi')
  },
  balancer: { 
    name: 'Balancer', 
    detect: (tx) => tx.to?.toLowerCase().includes('balancer')
  }
};

/* ================================
   STATE MANAGEMENT
================================ */
let currentAddress = null;
let portfolioData = {
  totalValue: 0,
  assets: [],
  protocols: {},
  chains: new Set()
};

/* ================================
   DOM ELEMENTS CACHE
================================ */
const el = {
  connectBtn: document.getElementById('connectBtn'),
  portfolioView: document.getElementById('portfolioView'),
  emptyState: document.getElementById('emptyState'),
  loadingState: document.getElementById('loadingState'),
  totalValue: document.getElementById('totalValue'),
  valueChange: document.getElementById('valueChange'),
  totalAssets: document.getElementById('totalAssets'),
  totalProtocols: document.getElementById('totalProtocols'),
  totalChains: document.getElementById('totalChains'),
  chainTabs: document.getElementById('chainTabs'),
  assetsList: document.getElementById('assetsList'),
  protocolsList: document.getElementById('protocolsList')
};

/* ================================
   HELPER FUNCTIONS
================================ */
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function shorten(addr) {
  return addr ? addr.slice(0, 6) + '…' + addr.slice(-4) : '–';
}

function formatNumber(num, decimals = 4) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toFixed(decimals);
}

/* ================================
   DATA FETCHING (DeBank-Style Aggregation)
================================ */

// Fetch token balances for a specific chain
async function fetchTokenBalances(address, chain) {
  const url = `${chain.api}?module=account&action=tokentx&address=${address}&page=1&offset=100&sort=desc&apikey=${chain.key}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.status === '1' && Array.isArray(data.result)) {
      const balances = {};
      
      // Calculate net balance for each token
      data.result.forEach(tx => {
        const token = tx.tokenSymbol;
        const isIncoming = tx.to.toLowerCase() === address.toLowerCase();
        const value = parseFloat(tx.value) / (10 ** parseInt(tx.tokenDecimal));
        
        if (!balances[token]) {
          balances[token] = {
            symbol: token,
            name: tx.tokenName,
            balance: 0,
            decimals: parseInt(tx.tokenDecimal),
            address: tx.contractAddress
          };
        }
        
        balances[token].balance += isIncoming ? value : -value;
      });
      
      // Filter out tokens with near-zero balance
      return Object.values(balances).filter(b => b.balance > 0.0001);
    }
  } catch (err) {
    console.error(`Error fetching ${chain.name} tokens:`, err);
  }
  
  return [];
}

// Fetch native balance (ETH, MATIC, etc.)
async function fetchNativeBalance(address, chain) {
  try {
    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest']
    });
    
    const value = parseInt(balance, 16) / 1e18;
    
    if (value > 0.000001) {
      return {
        symbol: chain.symbol,
        name: chain.name,
        balance: value,
        isNative: true
      };
    }
  } catch (err) {
    console.error(`Error fetching ${chain.name} balance:`, err);
  }
  
  return null;
}

// Detect protocol positions by analyzing transaction patterns
async function detectProtocols(address, chain) {
  const url = `${chain.api}?module=account&action=txlist&address=${address}&page=1&offset=100&sort=desc&apikey=${chain.key}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.status === '1' && Array.isArray(data.result)) {
      const protocols = {};
      
      data.result.forEach(tx => {
        for (const [key, adapter] of Object.entries(PROTOCOL_ADAPTERS)) {
          if (adapter.detect(tx)) {
            if (!protocols[key]) {
              protocols[key] = { 
                name: adapter.name, 
                txCount: 0,
                lastInteraction: 0
              };
            }
            protocols[key].txCount++;
            protocols[key].lastInteraction = Math.max(
              protocols[key].lastInteraction, 
              parseInt(tx.timeStamp)
            );
          }
        }
      });
      
      return protocols;
    }
  } catch (err) {
    console.error(`Error detecting protocols on ${chain.name}:`, err);
  }
  
  return {};
}

// Mock price fetcher (in production, use CoinGecko/CoinMarketCap API)
function getMockPrice(symbol) {
  const prices = {
    'ETH': 3500,
    'MATIC': 0.85,
    'USDC': 1.00,
    'USDT': 1.00,
    'DAI': 1.00,
    'WETH': 3500,
    'WBTC': 65000,
    'LINK': 15,
    'UNI': 7,
    'AAVE': 95
  };
  
  return prices[symbol] || Math.random() * 100;
}

/* ================================
   PORTFOLIO BUILDER (Core DeBank Logic)
================================ */
async function buildPortfolio(address) {
  console.log('🔄 Building portfolio for:', address);
  
  portfolioData = {
    totalValue: 0,
    assets: [],
    protocols: {},
    chains: new Set()
  };

  // For this demo, we'll fetch Ethereum data
  // In production, you'd parallelize all chains
  const chain = CHAINS.ethereum;
  
  try {
    // Step 1: Fetch native balance
    console.log('📊 Fetching native balance...');
    const native = await fetchNativeBalance(address, chain);
    if (native) {
      const price = getMockPrice(native.symbol);
      portfolioData.assets.push({
        ...native,
        value: native.balance * price,
        price: price,
        chain: chain.name,
        chainIcon: chain.icon
      });
      portfolioData.totalValue += native.balance * price;
      portfolioData.chains.add(chain.name);
    }

    // Step 2: Fetch token balances
    console.log('🪙 Fetching token balances...');
    const tokens = await fetchTokenBalances(address, chain);
    tokens.forEach(token => {
      const price = getMockPrice(token.symbol);
      const value = token.balance * price;
      
      portfolioData.assets.push({
        ...token,
        value: value,
        price: price,
        chain: chain.name,
        chainIcon: chain.icon
      });
      portfolioData.totalValue += value;
    });

    // Step 3: Detect protocol positions
    console.log('🔍 Detecting protocol positions...');
    const protocols = await detectProtocols(address, chain);
    portfolioData.protocols = protocols;

    console.log('✅ Portfolio built:', portfolioData);
    return portfolioData;

  } catch (err) {
    console.error('❌ Error building portfolio:', err);
    throw err;
  }
}

/* ================================
   RENDERING FUNCTIONS
================================ */

// Render portfolio overview stats
function renderOverview() {
  el.totalValue.textContent = formatCurrency(portfolioData.totalValue);
  el.totalAssets.textContent = portfolioData.assets.length;
  el.totalProtocols.textContent = Object.keys(portfolioData.protocols).length;
  el.totalChains.textContent = portfolioData.chains.size;
  
  // Mock 24h change (in production, compare with historical data)
  const change = portfolioData.totalValue * (Math.random() * 0.05 - 0.025);
  const isPositive = change >= 0;
  el.valueChange.className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
  el.valueChange.textContent = `${isPositive ? '+' : ''}${formatCurrency(Math.abs(change))} (24h)`;
}

// Render chain tabs
function renderChainTabs() {
  if (portfolioData.chains.size === 0) {
    el.chainTabs.innerHTML = '';
    return;
  }

  const html = Array.from(portfolioData.chains).map((chainName, index) => {
    const chain = Object.values(CHAINS).find(c => c.name === chainName);
    return `
      <div class="chain-tab ${index === 0 ? 'active' : ''}">
        ${chain?.icon || ''} ${chainName}
      </div>
    `;
  }).join('');
  
  el.chainTabs.innerHTML = html;
}

// Render assets list
function renderAssets() {
  if (portfolioData.assets.length === 0) {
    el.assetsList.innerHTML = `
      <div class="empty-state" style="padding: 40px;">
        <div style="font-size: 32px; margin-bottom: 12px;">📭</div>
        <p>No assets found</p>
      </div>
    `;
    return;
  }

  // Sort by value descending
  const sortedAssets = [...portfolioData.assets].sort((a, b) => b.value - a.value);

  const html = sortedAssets.map(asset => `
    <div class="asset-item">
      <div class="asset-icon">${asset.symbol[0]}</div>
      <div class="asset-info">
        <div class="asset-name">${asset.symbol}</div>
        <div class="asset-protocol">${asset.chainIcon || ''} ${asset.chain} ${asset.isNative ? '(Native)' : ''}</div>
      </div>
      <div class="asset-amount">${formatNumber(asset.balance)} ${asset.symbol}</div>
      <div class="asset-value">${formatCurrency(asset.value)}</div>
    </div>
  `).join('');
  
  el.assetsList.innerHTML = html;
}

// Render protocol positions
function renderProtocols() {
  if (Object.keys(portfolioData.protocols).length === 0) {
    el.protocolsList.innerHTML = `
      <div class="empty-state" style="padding: 40px; grid-column: 1/-1;">
        <div style="font-size: 32px; margin-bottom: 12px;">🔌</div>
        <p>No protocol interactions detected</p>
      </div>
    `;
    return;
  }

  const html = Object.entries(portfolioData.protocols)
    .sort((a, b) => b[1].txCount - a[1].txCount)
    .map(([key, protocol]) => {
      const lastDate = new Date(protocol.lastInteraction * 1000);
      const daysAgo = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return `
        <div class="protocol-card">
          <div class="protocol-name">${protocol.name}</div>
          <div class="protocol-value">${protocol.txCount} tx</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
            Last: ${daysAgo}d ago
          </div>
        </div>
      `;
    }).join('');
  
  el.protocolsList.innerHTML = html;
}

/* ================================
   WALLET CONNECTION
================================ */
async function connectWallet() {
  if (!window.ethereum) {
    alert('MetaMask is not installed. Please install MetaMask to continue.');
    return;
  }

  try {
    // Update UI to loading state
    el.connectBtn.disabled = true;
    el.connectBtn.textContent = 'Connecting...';
    el.emptyState.classList.add('hidden');
    el.loadingState.classList.remove('hidden');

    // Request account access
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    currentAddress = accounts[0];
    console.log('🔗 Connected:', currentAddress);

    // Build portfolio (DeBank-style aggregation)
    await buildPortfolio(currentAddress);

    // Render all sections
    renderOverview();
    renderChainTabs();
    renderAssets();
    renderProtocols();

    // Show portfolio view
    el.loadingState.classList.add('hidden');
    el.portfolioView.classList.remove('hidden');
    el.connectBtn.textContent = shorten(currentAddress);
    el.connectBtn.disabled = false;

  } catch (err) {
    console.error('❌ Connection error:', err);
    alert('Failed to connect wallet: ' + err.message);
    
    // Reset UI
    el.connectBtn.disabled = false;
    el.connectBtn.textContent = 'Connect Wallet';
    el.loadingState.classList.add('hidden');
    el.emptyState.classList.remove('hidden');
  }
}

/* ================================
   VIEW TOGGLE (Tokens / NFTs / DeFi)
================================ */
document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const view = btn.dataset.view;
    console.log('📊 Switching to view:', view);
    
    // In production, this would filter assets by type
    // For now, we'll just acknowledge the switch
  });
});

/* ================================
   EVENT LISTENERS
================================ */
el.connectBtn.addEventListener('click', connectWallet);

// Listen for wallet changes
if (window.ethereum) {
  window.ethereum.on('accountsChanged', (accounts) => {
    if (accounts.length === 0) {
      console.log('🔌 Wallet disconnected');
    }
    location.reload();
  });

  window.ethereum.on('chainChanged', () => {
    console.log('⛓️ Chain changed');
    location.reload();
  });
}

/* ================================
   INITIALIZATION
================================ */
console.log('✅ AutoTrack initialized');
console.log('📌 Ready to connect wallet');