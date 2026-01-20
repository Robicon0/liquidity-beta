console.log("🚀 AutoTrack Liquidity Premium - Initialized");

/* ================================
   CHAIN CONFIGURATION
================================ */
const CHAINS = {
  ethereum: {
    id: '0x1',
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    explorer: 'https://api.etherscan.io/api',
    apiKey: '7985AZCNWY5J9K4PB84WR4APQ4UBAPEPCH'
  },
  polygon: {
    id: '0x89',
    name: 'Polygon',
    symbol: 'MATIC',
    explorer: 'https://api.polygonscan.com/api',
    apiKey: 'YourPolygonAPIKey' // Replace with your Polygon API key
  },
  base: {
    id: '0x2105',
    name: 'Base',
    symbol: 'ETH',
    explorer: 'https://api.basescan.org/api',
    apiKey: 'YourBaseAPIKey' // Replace with your Base API key
  },
  arbitrum: {
    id: '0xa4b1',
    name: 'Arbitrum One',
    symbol: 'ETH',
    explorer: 'https://api.arbiscan.io/api',
    apiKey: 'YourArbitrumAPIKey' // Replace with your Arbitrum API key
  },
  optimism: {
    id: '0xa',
    name: 'Optimism',
    symbol: 'ETH',
    explorer: 'https://api-optimistic.etherscan.io/api',
    apiKey: 'YourOptimismAPIKey' // Replace with your Optimism API key
  }
};

const TX_LIMIT = 25;
let currentChain = 'ethereum';
let currentAddress = null;

/* ================================
   DOM ELEMENTS CACHE
================================ */
const el = {
  connectBtn: document.getElementById('connectBtn'),
  btnText: document.getElementById('btnText'),
  statusGrid: document.getElementById('statusGrid'),
  connectionBadge: document.getElementById('connectionBadge'),
  walletAddress: document.getElementById('walletAddress'),
  networkName: document.getElementById('networkName'),
  balance: document.getElementById('balance'),
  txList: document.getElementById('txList'),
  chainBadge: document.getElementById('chainBadge'),
  alertContainer: document.getElementById('alertContainer')
};

/* ================================
   BACKGROUND PARTICLES
================================ */
function createParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 15; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.width = Math.random() * 150 + 50 + 'px';
    particle.style.height = particle.style.width;
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 20 + 's';
    particle.style.animationDuration = (Math.random() * 20 + 15) + 's';
    container.appendChild(particle);
  }
}

/* ================================
   ALERT SYSTEM
================================ */
function showAlert(message, type = 'info') {
  const alert = document.createElement('div');
  alert.className = `alert ${type}`;
  alert.innerHTML = `
    <span>${type === 'error' ? '⚠️' : type === 'warning' ? '⚡' : 'ℹ️'}</span>
    <span>${message}</span>
  `;
  el.alertContainer.appendChild(alert);
  setTimeout(() => alert.remove(), 5000);
}

/* ================================
   HELPER FUNCTIONS
================================ */
function shorten(str) {
  return str ? str.slice(0, 6) + '…' + str.slice(-4) : '–';
}

function formatTime(unix) {
  const date = new Date(unix * 1000);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function direction(from, address) {
  return from.toLowerCase() === address.toLowerCase() ? 'out' : 'in';
}

/* ================================
   RENDER FUNCTIONS
================================ */
function clearTxList(message = '') {
  el.txList.innerHTML = message 
    ? `<li class="tx-item muted">${message}</li>` 
    : '';
}

function addTxItem(html) {
  el.txList.insertAdjacentHTML('beforeend', html);
}

function renderSection(title) {
  addTxItem(`<li class="tx-item section">${title}</li>`);
}

function renderLoading(text) {
  addTxItem(`<li class="tx-item muted">${text}<span class="spinner"></span></li>`);
}

function renderTx(label, dir, desc, timestamp) {
  addTxItem(`
    <li class="tx-item ${dir}">
      <div class="tx-content">
        <div class="tx-label">${label}</div>
        <div class="tx-desc">${desc}</div>
      </div>
      <div class="tx-time">${formatTime(timestamp)}</div>
    </li>
  `);
}

/* ================================
   API FETCH FUNCTIONS
================================ */
async function fetchTransactions(type, address) {
  const chain = CHAINS[currentChain];
  const actions = {
    normal: 'txlist',
    internal: 'txlistinternal',
    token: 'tokentx',
    nft: 'tokennfttx'
  };

  const url = `${chain.explorer}?module=account&action=${actions[type]}&address=${address}&page=1&offset=${TX_LIMIT}&sort=desc&apikey=${chain.apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== '1' || !Array.isArray(data.result) || !data.result.length) {
      return [];
    }

    return data.result;
  } catch (error) {
    console.error(`Error fetching ${type} transactions:`, error);
    return [];
  }
}

async function loadAllTransactions(address) {
  clearTxList('Fetching on-chain data from blockchain...');
  const chain = CHAINS[currentChain];

  // Normal Transactions
  renderSection(`📤 ${chain.symbol} Transactions`);
  renderLoading('Loading');
  const normalTxs = await fetchTransactions('normal', address);
  el.txList.lastElementChild?.remove();
  
  if (normalTxs.length === 0) {
    addTxItem('<li class="tx-item muted">No transactions found</li>');
  } else {
    normalTxs.forEach(tx => {
      const value = (parseFloat(tx.value) / 1e18).toFixed(6);
      renderTx(
        `${chain.symbol} Transfer`,
        direction(tx.from, address),
        `${shorten(tx.hash)} · ${value} ${chain.symbol}`,
        tx.timeStamp
      );
    });
  }

  await new Promise(resolve => setTimeout(resolve, 300));

  // Internal Transactions
  renderSection('🔄 Internal Transactions');
  renderLoading('Loading');
  const internalTxs = await fetchTransactions('internal', address);
  el.txList.lastElementChild?.remove();
  
  if (internalTxs.length === 0) {
    addTxItem('<li class="tx-item muted">No transactions found</li>');
  } else {
    internalTxs.forEach(tx => {
      const value = (parseFloat(tx.value) / 1e18).toFixed(6);
      renderTx(
        'Internal',
        direction(tx.from, address),
        `${shorten(tx.hash)} · ${value} ${chain.symbol}`,
        tx.timeStamp
      );
    });
  }

  await new Promise(resolve => setTimeout(resolve, 300));

  // ERC-20 Token Transfers
  renderSection('🪙 ERC-20 Token Transfers');
  renderLoading('Loading');
  const tokenTxs = await fetchTransactions('token', address);
  el.txList.lastElementChild?.remove();
  
  if (tokenTxs.length === 0) {
    addTxItem('<li class="tx-item muted">No transactions found</li>');
  } else {
    tokenTxs.forEach(tx => {
      const value = (tx.value / 10 ** tx.tokenDecimal).toFixed(4);
      renderTx(
        tx.tokenSymbol || 'Token',
        direction(tx.from, address),
        `${value} ${tx.tokenSymbol}`,
        tx.timeStamp
      );
    });
  }

  await new Promise(resolve => setTimeout(resolve, 300));

  // NFT Transfers
  renderSection('🖼️ NFT Transfers (ERC-721/1155)');
  renderLoading('Loading');
  const nftTxs = await fetchTransactions('nft', address);
  el.txList.lastElementChild?.remove();
  
  if (nftTxs.length === 0) {
    addTxItem('<li class="tx-item muted">No transactions found</li>');
  } else {
    nftTxs.forEach(tx => {
      renderTx(
        tx.tokenSymbol || 'NFT',
        direction(tx.from, address),
        `Token ID #${tx.tokenID}`,
        tx.timeStamp
      );
    });
  }
}

/* ================================
   WALLET CONNECTION
================================ */
async function connectWallet() {
  if (!window.ethereum) {
    showAlert('MetaMask not detected. Please install MetaMask to continue.', 'error');
    return;
  }

  try {
    el.btnText.innerHTML = 'Connecting...<span class="spinner"></span>';
    el.connectBtn.disabled = true;

    // Request account access
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    const account = accounts[0];

    // Get current chain ID
    const chainId = await window.ethereum.request({ 
      method: 'eth_chainId' 
    });
    
    const chain = CHAINS[currentChain];

    // Validate chain
    if (chainId !== chain.id) {
      showAlert(`Please switch to ${chain.name} in MetaMask`, 'warning');
      el.btnText.textContent = 'Wrong Network';
      el.connectBtn.disabled = false;
      clearTxList(`⚠️ Please switch to ${chain.name} in your wallet`);
      return;
    }

    // Get balance
    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [account, 'latest']
    });

    // Update UI
    el.walletAddress.textContent = shorten(account);
    el.networkName.textContent = chain.name;
    el.balance.textContent = (parseInt(balance, 16) / 1e18).toFixed(6) + ' ' + chain.symbol;
    
    el.statusGrid.classList.remove('hidden');
    el.connectionBadge.classList.remove('hidden');
    el.btnText.textContent = 'Connected';
    el.connectBtn.disabled = true;

    currentAddress = account;
    
    // Load transactions
    await loadAllTransactions(account);

    showAlert('Wallet connected successfully!', 'info');

  } catch (error) {
    console.error('Connection error:', error);
    showAlert('Failed to connect wallet: ' + error.message, 'error');
    el.btnText.textContent = 'Connect Wallet';
    el.connectBtn.disabled = false;
  }
}

/* ================================
   CHAIN SWITCHING
================================ */
document.querySelectorAll('.chain-btn').forEach(button => {
  button.addEventListener('click', () => {
    // Update active state
    document.querySelectorAll('.chain-btn').forEach(btn => 
      btn.classList.remove('active')
    );
    button.classList.add('active');
    
    // Update current chain
    currentChain = button.dataset.chain;
    el.chainBadge.textContent = CHAINS[currentChain].name;
    
    // Reset connection state if wallet was connected
    if (currentAddress) {
      el.statusGrid.classList.add('hidden');
      el.connectionBadge.classList.add('hidden');
      el.btnText.textContent = 'Connect Wallet';
      el.connectBtn.disabled = false;
      clearTxList('Please reconnect your wallet for the selected chain');
      currentAddress = null;
      showAlert(`Switched to ${CHAINS[currentChain].name}. Please reconnect.`, 'info');
    }
  });
});

/* ================================
   EVENT LISTENERS
================================ */
el.connectBtn.addEventListener('click', connectWallet);

// Listen for account/chain changes
if (window.ethereum) {
  window.ethereum.on('accountsChanged', (accounts) => {
    if (accounts.length === 0) {
      showAlert('Wallet disconnected', 'warning');
    }
    location.reload();
  });

  window.ethereum.on('chainChanged', () => {
    location.reload();
  });
}

/* ================================
   INITIALIZATION
================================ */
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ AutoTrack Liquidity loaded successfully');
  createParticles();
});