console.log("AutoTrack Liquidity – JS loaded");

/* ================================
   CONFIG
================================ */

// 🔐 KEEP YOUR API KEY EXACTLY AS IS
const ETHERSCAN_API_KEY = "7985AZCNWY5J9K4PB84WR4APQ4UBAPEPCH";
const TX_LIMIT = 25;

/* ================================
   CHAIN CONFIG
================================ */

const CHAIN_MAP = {
  "0x1": "Ethereum Mainnet",
};

function shorten(str) {
  return str.slice(0, 6) + "…" + str.slice(-4);
}

function formatTime(unix) {
  return new Date(unix * 1000).toLocaleString();
}

function resetTxList(msg) {
  document.getElementById("txList").innerHTML =
    `<li class="muted">${msg}</li>`;
}

/* ================================
   RENDER HELPERS
================================ */

function renderSection(title) {
  const ul = document.getElementById("txList");
  const li = document.createElement("li");
  li.className = "muted";
  li.style.fontWeight = "600";
  li.style.marginTop = "12px";
  li.textContent = title;
  ul.appendChild(li);
}

function renderTx(label, direction, description, timestamp) {
  const ul = document.getElementById("txList");

  const li = document.createElement("li");
  li.className = direction;

  li.innerHTML = `
    <div>
      <strong>${label}</strong><br/>
      <span>${description}</span>
    </div>
    <span>${formatTime(timestamp)}</span>
  `;

  ul.appendChild(li);
}

/* ================================
   FETCHERS (ALL OF THEM)
================================ */

async function fetchNormalTx(address) {
  const url =
    `https://api.etherscan.io/api` +
    `?module=account&action=txlist` +
    `&address=${address}` +
    `&page=1&offset=${TX_LIMIT}` +
    `&sort=desc&apikey=${ETHERSCAN_API_KEY}`;

  const r = await fetch(url).then(r => r.json());
  if (r.status !== "1") return [];

  return r.result.map(tx => ({
    label: "ETH Tx",
    direction: tx.from.toLowerCase() === address.toLowerCase() ? "out" : "in",
    description: `${shorten(tx.hash)} · ${parseFloat(tx.value) / 1e18} ETH`,
    time: tx.timeStamp,
  }));
}

async function fetchInternalTx(address) {
  const url =
    `https://api.etherscan.io/api` +
    `?module=account&action=txlistinternal` +
    `&address=${address}` +
    `&page=1&offset=${TX_LIMIT}` +
    `&sort=desc&apikey=${ETHERSCAN_API_KEY}`;

  const r = await fetch(url).then(r => r.json());
  if (r.status !== "1") return [];

  return r.result.map(tx => ({
    label: "Internal ETH",
    direction: tx.from.toLowerCase() === address.toLowerCase() ? "out" : "in",
    description: `${shorten(tx.hash)} · ${parseFloat(tx.value) / 1e18} ETH`,
    time: tx.timeStamp,
  }));
}

async function fetchERC20Tx(address) {
  const url =
    `https://api.etherscan.io/api` +
    `?module=account&action=tokentx` +
    `&address=${address}` +
    `&page=1&offset=${TX_LIMIT}` +
    `&sort=desc&apikey=${ETHERSCAN_API_KEY}`;

  const r = await fetch(url).then(r => r.json());
  if (r.status !== "1") return [];

  return r.result.map(tx => ({
    label: `ERC-20 ${tx.tokenSymbol}`,
    direction: tx.from.toLowerCase() === address.toLowerCase() ? "out" : "in",
    description: `${tx.value / (10 ** tx.tokenDecimal)} ${tx.tokenSymbol}`,
    time: tx.timeStamp,
  }));
}

async function fetchNFTTx(address) {
  const url =
    `https://api.etherscan.io/api` +
    `?module=account&action=tokennfttx` +
    `&address=${address}` +
    `&page=1&offset=${TX_LIMIT}` +
    `&sort=desc&apikey=${ETHERSCAN_API_KEY}`;

  const r = await fetch(url).then(r => r.json());
  if (r.status !== "1") return [];

  return r.result.map(tx => ({
    label: `NFT ${tx.tokenSymbol || "NFT"}`,
    direction: tx.from.toLowerCase() === address.toLowerCase() ? "out" : "in",
    description: `Token ID ${tx.tokenID}`,
    time: tx.timeStamp,
  }));
}

/* ================================
   MASTER FETCH
================================ */

async function fetchAllTransactions(address) {
  resetTxList("Loading ALL transaction data…");

  const ul = document.getElementById("txList");
  ul.innerHTML = "";

  const [normal, internal, erc20, nft] = await Promise.all([
    fetchNormalTx(address),
    fetchInternalTx(address),
    fetchERC20Tx(address),
    fetchNFTTx(address),
  ]);

  renderSection("Normal ETH Transactions");
  normal.forEach(tx => renderTx(tx.label, tx.direction, tx.description, tx.time));

  renderSection("Internal ETH Transactions");
  internal.forEach(tx => renderTx(tx.label, tx.direction, tx.description, tx.time));

  renderSection("ERC-20 Token Transfers");
  erc20.forEach(tx => renderTx(tx.label, tx.direction, tx.description, tx.time));

  renderSection("NFT Transfers");
  nft.forEach(tx => renderTx(tx.label, tx.direction, tx.description, tx.time));
}

/* ================================
   WALLET LOGIC
================================ */

async function connectWallet(state) {
  const { walletEl, chainEl, balanceEl, debugEl } = state;

  debugEl.textContent = "Connecting wallet…";

  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  const account = accounts[0];

  walletEl.textContent = shorten(account);

  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  chainEl.textContent = CHAIN_MAP[chainId] || chainId;

  if (chainId !== "0x1") {
    debugEl.textContent = "Switch to Ethereum Mainnet to view transactions.";
    resetTxList("Ethereum only (for now)");
    return;
  }

  const bal = await window.ethereum.request({
    method: "eth_getBalance",
    params: [account, "latest"],
  });

  balanceEl.textContent = (parseInt(bal, 16) / 1e18).toFixed(6) + " ETH";

  debugEl.textContent = "Fetching ALL transaction types…";

  fetchAllTransactions(account);
}

/* ================================
   BOOTSTRAP
================================ */

document.addEventListener("DOMContentLoaded", () => {
  const state = {
    walletEl: document.getElementById("wallet"),
    chainEl: document.getElementById("chain"),
    balanceEl: document.getElementById("balance"),
    debugEl: document.querySelector(".debug p"),
  };

  document.getElementById("connectBtn").onclick = () =>
    connectWallet(state);
});
