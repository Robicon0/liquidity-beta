console.log("AutoTrack Liquidity – JS loaded");

/* ================================
   CONFIG
================================ */

// 🔐 KEEP YOUR API KEY EXACTLY AS IS
const ETHERSCAN_API_KEY = "7985AZCNWY5J9K4PB84WR4APQ4UBAPEPCH";
const TX_LIMIT = 25;

/* ================================
   STATE (DOM CACHE)
================================ */

let txListEl = null;

/* ================================
   HELPERS
================================ */

function shorten(str) {
  return str.slice(0, 6) + "…" + str.slice(-4);
}

function formatTime(unix) {
  return new Date(unix * 1000).toLocaleString();
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
  safeInsert(`
    <li class="muted" style="font-weight:600;margin-top:14px;">
      ${title}
    </li>
  `);
}

function renderPlaceholder(text) {
  safeInsert(`<li class="muted">${text}</li>`);
}

function renderTx(label, dir, desc, ts) {
  safeInsert(`
    <li class="${dir}">
      <div>
        <strong>${label}</strong><br/>
        <span>${desc}</span>
      </div>
      <span>${formatTime(ts)}</span>
    </li>
  `);
}

/* ================================
   GENERIC FETCH + RENDER
================================ */

async function fetchAndRender({ title, url, parser, address }) {
  renderSection(title);
  renderPlaceholder("Loading…");

  try {
    const res = await fetch(url);
    const data = await res.json();

    // remove "Loading…"
    txListEl.lastElementChild?.remove();

    if (data.status !== "1" || !Array.isArray(data.result) || !data.result.length) {
      renderPlaceholder("No data found");
      return;
    }

    data.result.forEach((tx) => parser(tx, address));
  } catch (err) {
    console.error(title, err);
    txListEl.lastElementChild?.remove();
    renderPlaceholder("Failed to load");
  }
}

/* ================================
   MASTER FETCH
================================ */

function fetchAllTransactions(address) {
  clearTxList("Fetching all transaction data…");

  // Normal ETH
  fetchAndRender({
    title: "Normal ETH Transactions",
    address,
    url:
      `https://api.etherscan.io/api` +
      `?module=account&action=txlist` +
      `&address=${address}&page=1&offset=${TX_LIMIT}` +
      `&sort=desc&apikey=${ETHERSCAN_API_KEY}`,
    parser: (tx, addr) =>
      renderTx(
        "ETH",
        direction(tx.from, addr),
        `${shorten(tx.hash)} · ${parseFloat(tx.value) / 1e18} ETH`,
        tx.timeStamp
      ),
  });

  // Internal ETH
  fetchAndRender({
    title: "Internal ETH Transactions",
    address,
    url:
      `https://api.etherscan.io/api` +
      `?module=account&action=txlistinternal` +
      `&address=${address}&page=1&offset=${TX_LIMIT}` +
      `&sort=desc&apikey=${ETHERSCAN_API_KEY}`,
    parser: (tx, addr) =>
      renderTx(
        "Internal ETH",
        direction(tx.from, addr),
        `${shorten(tx.hash)} · ${parseFloat(tx.value) / 1e18} ETH`,
        tx.timeStamp
      ),
  });

  // ERC-20
  fetchAndRender({
    title: "ERC-20 Token Transfers",
    address,
    url:
      `https://api.etherscan.io/api` +
      `?module=account&action=tokentx` +
      `&address=${address}&page=1&offset=${TX_LIMIT}` +
      `&sort=desc&apikey=${ETHERSCAN_API_KEY}`,
    parser: (tx, addr) =>
      renderTx(
        tx.tokenSymbol,
        direction(tx.from, addr),
        `${tx.value / 10 ** tx.tokenDecimal} ${tx.tokenSymbol}`,
        tx.timeStamp
      ),
  });

  // NFTs
  fetchAndRender({
    title: "NFT Transfers",
    address,
    url:
      `https://api.etherscan.io/api` +
      `?module=account&action=tokennfttx` +
      `&address=${address}&page=1&offset=${TX_LIMIT}` +
      `&sort=desc&apikey=${ETHERSCAN_API_KEY}`,
    parser: (tx, addr) =>
      renderTx(
        tx.tokenSymbol || "NFT",
        direction(tx.from, addr),
        `Token ID ${tx.tokenID}`,
        tx.timeStamp
      ),
  });
}

/* ================================
   WALLET LOGIC
================================ */

async function connectWallet() {
  const walletEl = document.getElementById("wallet");
  const chainEl = document.getElementById("chain");
  const balanceEl = document.getElementById("balance");
  const debugEl = document.querySelector(".debug p");

  debugEl.textContent = "Connecting wallet…";

  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  const account = accounts[0];

  walletEl.textContent = shorten(account);

  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  chainEl.textContent = chainId === "0x1" ? "Ethereum Mainnet" : chainId;

  if (chainId !== "0x1") {
    debugEl.textContent = "Switch to Ethereum Mainnet.";
    clearTxList("Ethereum only (for now)");
    return;
  }

  const bal = await window.ethereum.request({
    method: "eth_getBalance",
    params: [account, "latest"],
  });

  balanceEl.textContent = (parseInt(bal, 16) / 1e18).toFixed(6) + " ETH";

  debugEl.textContent = "Fetching all transaction data…";

  fetchAllTransactions(account);
}

/* ================================
   BOOTSTRAP (SAFE)
================================ */

document.addEventListener("DOMContentLoaded", () => {
  txListEl = document.getElementById("txList");

  if (!txListEl) {
    console.error("txList element not found in DOM");
    return;
  }

  document.getElementById("connectBtn").onclick = connectWallet;
});
