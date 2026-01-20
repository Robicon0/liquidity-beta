console.log("AutoTrack Liquidity – Enhanced Beta Loaded");

/* ================================
   CONFIG
================================ */
const ETHERSCAN_API_KEY = "7985AZCNWY5J9K4PB84WR4APQ4UBAPEPCH";
const TX_LIMIT = 25;
const ETHEREUM_MAINNET = "0x1";

/* ================================
   STATE
================================ */
let txListEl = null;
let currentAddress = null;

/* ================================
   HELPERS
================================ */
function shorten(str) {
  if (!str) return "–";
  return str.slice(0, 6) + "…" + str.slice(-4);
}

function formatTime(unix) {
  const date = new Date(unix * 1000);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function direction(from, address) {
  return from.toLowerCase() === address.toLowerCase() ? "out" : "in";
}

function safeInsert(html) {
  if (!txListEl) return;
  txListEl.insertAdjacentHTML("beforeend", html);
}

function clearTxList(message) {
  if (!txListEl) return;
  txListEl.innerHTML = `<li class="muted">${message}</li>`;
}

/* ================================
   RENDER HELPERS
================================ */
function renderSection(title) {
  safeInsert(`<li class="section-header">${title}</li>`);
}

function renderPlaceholder(text, isLoading = false) {
  const loadingSpinner = isLoading ? '<span class="loading"></span>' : '';
  safeInsert(`<li class="muted">${text}${loadingSpinner}</li>`);
}

function renderTx(label, dir, desc, ts) {
  safeInsert(`
    <li class="${dir}">
      <div class="tx-content">
        <div class="tx-label">${label}</div>
        <div class="tx-desc">${desc}</div>
      </div>
      <div class="tx-time">${formatTime(ts)}</div>
    </li>
  `);
}

/* ================================
   API FETCH
================================ */
async function fetchAndRender({ title, url, parser, address }) {
  renderSection(title);
  renderPlaceholder("Loading", true);

  try {
    const res = await fetch(url);
    const data = await res.json();

    // Remove loading placeholder
    txListEl.lastElementChild?.remove();

    if (data.status !== "1" || !Array.isArray(data.result) || !data.result.length) {
      renderPlaceholder("No transactions found");
      return;
    }

    data.result.forEach((tx) => parser(tx, address));
  } catch (err) {
    console.error(`${title} error:`, err);
    txListEl.lastElementChild?.remove();
    renderPlaceholder("Failed to load data");
  }
}

/* ================================
   FETCH ALL TRANSACTIONS
================================ */
function fetchAllTransactions(address) {
  clearTxList("Fetching on-chain data from Ethereum...");
  currentAddress = address;

  // Normal ETH Transactions
  fetchAndRender({
    title: "📤 Normal ETH Transactions",
    address,
    url: `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&page=1&offset=${TX_LIMIT}&sort=desc&apikey=${ETHERSCAN_API_KEY}`,
    parser: (tx, addr) => {
      const value = (parseFloat(tx.value) / 1e18).toFixed(6);
      renderTx(
        "ETH Transfer",
        direction(tx.from, addr),
        `${shorten(tx.hash)} · ${value} ETH`,
        tx.timeStamp
      );
    },
  });

  // Internal ETH Transactions
  fetchAndRender({
    title: "🔄 Internal ETH Transactions",
    address,
    url: `https://api.etherscan.io/api?module=account&action=txlistinternal&address=${address}&page=1&offset=${TX_LIMIT}&sort=desc&apikey=${ETHERSCAN_API_KEY}`,
    parser: (tx, addr) => {
      const value = (parseFloat(tx.value) / 1e18).toFixed(6);
      renderTx(
        "Internal ETH",
        direction(tx.from, addr),
        `${shorten(tx.hash)} · ${value} ETH`,
        tx.timeStamp
      );
    },
  });

  // ERC-20 Token Transfers
  fetchAndRender({
    title: "🪙 ERC-20 Token Transfers",
    address,
    url: `https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&page=1&offset=${TX_LIMIT}&sort=desc&apikey=${ETHERSCAN_API_KEY}`,
    parser: (tx, addr) => {
      const value = (tx.value / 10 ** tx.tokenDecimal).toFixed(4);
      renderTx(
        tx.tokenSymbol || "Token",
        direction(tx.from, addr),
        `${value} ${tx.tokenSymbol}`,
        tx.timeStamp
      );
    },
  });

  // NFT Transfers
  fetchAndRender({
    title: "🖼️ NFT Transfers (ERC-721/1155)",
    address,
    url: `https://api.etherscan.io/api?module=account&action=tokennfttx&address=${address}&page=1&offset=${TX_LIMIT}&sort=desc&apikey=${ETHERSCAN_API_KEY}`,
    parser: (tx, addr) => {
      renderTx(
        tx.tokenSymbol || "NFT",
        direction(tx.from, addr),
        `Token ID #${tx.tokenID}`,
        tx.timeStamp
      );
    },
  });
}

/* ================================
   WALLET CONNECTION
================================ */
async function connectWallet() {
  const connectBtn = document.getElementById("connectBtn");
  const walletEl = document.getElementById("wallet");
  const chainEl = document.getElementById("chain");
  const balanceEl = document.getElementById("balance");
  const statusSection = document.getElementById("statusSection");
  const connectionBadge = document.getElementById("connectionBadge");

  // Check if MetaMask is installed
  if (!window.ethereum) {
    alert("MetaMask is not installed. Please install MetaMask to use AutoTrack Liquidity.");
    return;
  }

  try {
    connectBtn.disabled = true;
    connectBtn.textContent = "Connecting...";

    // Request account access
    const accounts = await window.ethereum.request({ 
      method: "eth_requestAccounts" 
    });
    const account = accounts[0];

    // Get chain ID
    const chainId = await window.ethereum.request({ 
      method: "eth_chainId" 
    });

    // Validate Ethereum Mainnet
    if (chainId !== ETHEREUM_MAINNET) {
      alert("Please switch to Ethereum Mainnet in MetaMask.");
      clearTxList("⚠️ Ethereum Mainnet required. Please switch networks in MetaMask.");
      connectBtn.disabled = false;
      connectBtn.textContent = "Connect Wallet (MetaMask)";
      return;
    }

    // Get balance
    const bal = await window.ethereum.request({
      method: "eth_getBalance",
      params: [account, "latest"],
    });

    // Update UI
    walletEl.textContent = shorten(account);
    chainEl.textContent = "Ethereum Mainnet";
    balanceEl.textContent = (parseInt(bal, 16) / 1e18).toFixed(6) + " ETH";
    
    statusSection.style.display = "grid";
    connectionBadge.style.display = "inline-block";
    connectBtn.textContent = "Connected";
    connectBtn.disabled = true;

    // Fetch transactions
    fetchAllTransactions(account);

  } catch (err) {
    console.error("Connection error:", err);
    alert("Failed to connect wallet. Please try again.");
    connectBtn.disabled = false;
    connectBtn.textContent = "Connect Wallet (MetaMask)";
  }
}

/* ================================
   INITIALIZATION
================================ */
document.addEventListener("DOMContentLoaded", () => {
  txListEl = document.getElementById("txList");

  if (!txListEl) {
    console.error("Transaction list element not found");
    return;
  }

  const connectBtn = document.getElementById("connectBtn");
  if (connectBtn) {
    connectBtn.onclick = connectWallet;
  }

  // Listen for account/chain changes
  if (window.ethereum) {
    window.ethereum.on("accountsChanged", (accounts) => {
      if (accounts.length > 0 && currentAddress) {
        location.reload();
      }
    });

    window.ethereum.on("chainChanged", () => {
      location.reload();
    });
  }
});