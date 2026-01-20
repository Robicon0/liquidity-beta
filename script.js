console.log("AutoTrack Liquidity – Beta v0.1");

/* ================================
   CONFIGURATION
================================ */

// 🔐 ETHERSCAN API KEY (Read-only access only)
const ETHERSCAN_API_KEY = "7985AZCNWY5J9K4PB84WR4APQ4UBAPEPCH";
const TX_LIMIT = 25;

/* ================================
   STATE MANAGEMENT
================================ */

let txListEl = null;
let currentAddress = null;
let debugStatusEl = null;
let apiStatusEl = null;

/* ================================
   UTILITY FUNCTIONS
================================ */

function shortenAddress(str) {
  if (!str || str === "Not connected") return str;
  return str.slice(0, 6) + "…" + str.slice(-4);
}

function formatTime(unix) {
  return new Date(unix * 1000).toLocaleString();
}

function getTransactionDirection(from, address) {
  return from.toLowerCase() === address.toLowerCase() ? "out" : "in";
}

function safeInsertHTML(html) {
  if (!txListEl) return;
  txListEl.insertAdjacentHTML("beforeend", html);
}

function clearTransactionList(message) {
  if (!txListEl) return;
  txListEl.innerHTML = `<li class="muted">${message}</li>`;
}

function updateDebugStatus(message) {
  if (debugStatusEl) debugStatusEl.textContent = message;
}

function updateAPIStatus(status) {
  if (apiStatusEl) apiStatusEl.textContent = status;
}

/* ================================
   RENDER FUNCTIONS
================================ */

function renderSectionHeader(title, description = "") {
  safeInsertHTML(`
    <li class="section-header">
      <div>
        <strong>${title}</strong>
        ${description ? `<br/><span class="section-desc">${description}</span>` : ''}
      </div>
    </li>
  `);
}

function renderPlaceholder(text) {
  safeInsertHTML(`<li class="muted placeholder">${text}</li>`);
}

function renderTransaction(type, direction, description, timestamp, hash = "") {
  const directionLabel = direction === "in" ? "IN" : "OUT";
  const directionClass = direction === "in" ? "incoming" : "outgoing";
  
  safeInsertHTML(`
    <li class="transaction-item ${directionClass}">
      <div class="tx-main">
        <div class="tx-header">
          <span class="tx-type">${type}</span>
          <span class="tx-direction ${directionClass}">${directionLabel}</span>
        </div>
        <div class="tx-desc">${description}</div>
        ${hash ? `<div class="tx-hash">${shortenAddress(hash)}</div>` : ''}
      </div>
      <div class="tx-time">${formatTime(timestamp)}</div>
    </li>
  `);
}

/* ================================
   API FETCH & PROCESSING
================================ */

async function fetchTransactions({ title, description, url, parser, address }) {
  renderSectionHeader(title, description);
  renderPlaceholder("Loading…");

  try {
    updateAPIStatus("Fetching…");
    
    const response = await fetch(url);
    const data = await response.json();

    // Remove loading placeholder
    if (txListEl && txListEl.lastElementChild) {
      txListEl.lastElementChild.remove();
    }

    if (data.status !== "1" || !Array.isArray(data.result) || data.result.length === 0) {
      renderPlaceholder("No transactions found");
      updateAPIStatus("No data");
      return;
    }

    data.result.forEach((tx) => parser(tx, address));
    updateAPIStatus(`Loaded ${data.result.length} records`);
    
  } catch (error) {
    console.error(`Error fetching ${title}:`, error);
    
    if (txListEl && txListEl.lastElementChild) {
      txListEl.lastElementChild.remove();
    }
    
    renderPlaceholder("Failed to load data");
    updateAPIStatus("Error");
  }
}

/* ================================
   MAIN TRANSACTION FETCHER
================================ */

function fetchAllOnChainActivity(address) {
  if (!address) return;
  
  currentAddress = address;
  clearTransactionList("Loading on-chain activity…");
  updateDebugStatus("Fetching blockchain data…");

  // 1. Normal ETH Transactions
  fetchTransactions({
    title: "ETH Transfers",
    description: "Standard Ethereum transactions",
    address,
    url: `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&page=1&offset=${TX_LIMIT}&sort=desc&apikey=${ETHERSCAN_API_KEY}`,
    parser: (tx, addr) => renderTransaction(
      "ETH",
      getTransactionDirection(tx.from, addr),
      `${(parseFloat(tx.value) / 1e18).toFixed(6)} ETH`,
      tx.timeStamp,
      tx.hash
    ),
  });

  // 2. Internal ETH Transactions
  fetchTransactions({
    title: "Internal Transactions",
    description: "Contract-to-contract transfers",
    address,
    url: `https://api.etherscan.io/api?module=account&action=txlistinternal&address=${address}&page=1&offset=${TX_LIMIT}&sort=desc&apikey=${ETHERSCAN_API_KEY}`,
    parser: (tx, addr) => renderTransaction(
      "Internal ETH",
      getTransactionDirection(tx.from, addr),
      `${(parseFloat(tx.value) / 1e18).toFixed(6)} ETH`,
      tx.timeStamp,
      tx.hash
    ),
  });

  // 3. ERC-20 Token Transfers
  fetchTransactions({
    title: "ERC-20 Transfers",
    description: "Token transfers and swaps",
    address,
    url: `https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&page=1&offset=${TX_LIMIT}&sort=desc&apikey=${ETHERSCAN_API_KEY}`,
    parser: (tx, addr) => renderTransaction(
      tx.tokenSymbol || "TOKEN",
      getTransactionDirection(tx.from, addr),
      `${(tx.value / Math.pow(10, tx.tokenDecimal)).toFixed(4)} ${tx.tokenSymbol || ""}`,
      tx.timeStamp,
      tx.hash
    ),
  });

  // 4. NFT Transfers
  fetchTransactions({
    title: "NFT Transfers",
    description: "Non-fungible token transfers",
    address,
    url: `https://api.etherscan.io/api?module=account&action=tokennfttx&address=${address}&page=1&offset=${TX_LIMIT}&sort=desc&apikey=${ETHERSCAN_API_KEY}`,
    parser: (tx, addr) => renderTransaction(
      tx.tokenSymbol || "NFT",
      getTransactionDirection(tx.from, addr),
      `Token ID: ${tx.tokenID}`,
      tx.timeStamp,
      tx.hash
    ),
  });
}

/* ================================
   WALLET CONNECTION & MANAGEMENT
================================ */

async function connectMetaMaskWallet() {
  const walletEl = document.getElementById("wallet");
  const chainEl = document.getElementById("chain");
  const balanceEl = document.getElementById("balance");
  const connectBtn = document.getElementById("connectBtn");
  
  if (!window.ethereum) {
    updateDebugStatus("MetaMask not detected. Please install MetaMask.");
    alert("MetaMask is required to use AutoTrack Liquidity. Please install the extension.");
    return;
  }

  try {
    updateDebugStatus("Requesting wallet connection…");
    connectBtn.disabled = true;
    connectBtn.innerHTML = '<span>Connecting…</span>';

    // Request account access
    const accounts = await window.ethereum.request({ 
      method: "eth_requestAccounts" 
    });
    
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found");
    }

    const account = accounts[0];
    walletEl.textContent = shortenAddress(account);
    updateDebugStatus(`Connected: ${shortenAddress(account)}`);

    // Get current chain
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    
    // Verify Ethereum Mainnet (Chain ID: 0x1)
    if (chainId !== "0x1") {
      chainEl.textContent = `Unsupported Network (ID: ${chainId})`;
      chainEl.className = "status-value warning";
      updateDebugStatus("Please switch to Ethereum Mainnet.");
      
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x1" }],
        });
        // Reload after switch
        location.reload();
      } catch (switchError) {
        console.error("Failed to switch network:", switchError);
        clearTransactionList("Switch to Ethereum Mainnet to continue");
      }
      return;
    }

    // Update chain display
    chainEl.textContent = "Ethereum Mainnet";
    chainEl.className = "status-value success";
    
    // Get ETH balance
    const balance = await window.ethereum.request({
      method: "eth_getBalance",
      params: [account, "latest"],
    });
    
    const ethBalance = parseInt(balance, 16) / 1e18;
    balanceEl.textContent = `${ethBalance.toFixed(6)} ETH`;
    
    // Update button state
    connectBtn.innerHTML = '<span>Connected ✓</span>';
    connectBtn.disabled = true;
    connectBtn.style.background = "linear-gradient(135deg, #10b981, #34d399)";
    
    // Fetch all transactions
    updateDebugStatus("Reconstructing on-chain activity…");
    fetchAllOnChainActivity(account);

  } catch (error) {
    console.error("Wallet connection error:", error);
    updateDebugStatus(`Connection failed: ${error.message}`);
    connectBtn.disabled = false;
    connectBtn.innerHTML = '<span>Connect MetaMask Wallet</span>';
    
    walletEl.textContent = "Not connected";
    chainEl.textContent = "–";
    balanceEl.textContent = "–";
  }
}

/* ================================
   EVENT LISTENERS & INITIALIZATION
================================ */

function setupEventListeners() {
  const connectBtn = document.getElementById("connectBtn");
  if (connectBtn) {
    connectBtn.addEventListener("click", connectMetaMaskWallet);
  }

  // Listen for chain changes
  if (window.ethereum) {
    window.ethereum.on("chainChanged", (chainId) => {
      if (chainId === "0x1" && currentAddress) {
        // Refresh data on chain switch to Ethereum
        fetchAllOnChainActivity(currentAddress);
      } else {
        clearTransactionList("Please switch to Ethereum Mainnet");
        updateDebugStatus("Network changed. Please switch to Ethereum Mainnet.");
      }
    });

    // Listen for account changes
    window.ethereum.on("accountsChanged", (accounts) => {
      if (accounts.length > 0) {
        currentAddress = accounts[0];
        document.getElementById("wallet").textContent = shortenAddress(currentAddress);
        fetchAllOnChainActivity(currentAddress);
      } else {
        // User disconnected all accounts
        location.reload();
      }
    });
  }
}

/* ================================
   DOM READY INITIALIZATION
================================ */

document.addEventListener("DOMContentLoaded", () => {
  console.log("AutoTrack Liquidity initialized");
  
  // Cache DOM elements
  txListEl = document.getElementById("txList");
  debugStatusEl = document.getElementById("debugStatus");
  apiStatusEl = document.getElementById("apiStatus");
  
  // Initialize debug panel
  if (debugStatusEl) {
    debugStatusEl.textContent = "Ready to connect wallet";
  }
  
  if (apiStatusEl) {
    apiStatusEl.textContent = "Standby";
  }
  
  // Set transaction limit display
  const txLimitEl = document.getElementById("txLimit");
  if (txLimitEl) {
    txLimitEl.textContent = `${TX_LIMIT} per category`;
  }
  
  // Setup event listeners
  setupEventListeners();
  
  // Check for existing connection on page load
  if (window.ethereum && window.ethereum.selectedAddress) {
    setTimeout(() => {
      currentAddress = window.ethereum.selectedAddress;
      document.getElementById("wallet").textContent = shortenAddress(currentAddress);
      document.getElementById("connectBtn").innerHTML = '<span>Reconnect</span>';
      updateDebugStatus("Detected previous connection");
    }, 500);
  }
});