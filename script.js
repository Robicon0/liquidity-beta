console.log("AutoTrack Liquidity – JS loaded");

/* ================================
   CONFIG
================================ */

// 🔐 KEEP YOUR API KEY EXACTLY AS IS
const ETHERSCAN_API_KEY = "7985AZCNWY5J9K4PB84WR4APQ4UBAPEPCH";
const TX_LIMIT = 25;

/* ================================
   HELPERS
================================ */

function shorten(str) {
  return str.slice(0, 6) + "…" + str.slice(-4);
}

function formatTime(unix) {
  return new Date(unix * 1000).toLocaleString();
}

function txDirection(from, address) {
  return from.toLowerCase() === address.toLowerCase() ? "out" : "in";
}

function sectionHeader(title) {
  return `
    <li class="muted" style="font-weight:600;margin-top:12px;">
      ${title}
    </li>
  `;
}

function placeholder(text) {
  return `<li class="muted">${text}</li>`;
}

function renderTx(label, direction, description, timestamp) {
  return `
    <li class="${direction}">
      <div>
        <strong>${label}</strong><br/>
        <span>${description}</span>
      </div>
      <span>${formatTime(timestamp)}</span>
    </li>
  `;
}

/* ================================
   FETCHERS (SAFE, ISOLATED)
================================ */

async function fetchAndRender({
  title,
  url,
  parseFn,
  address,
}) {
  const txList = document.getElementById("txList");

  txList.insertAdjacentHTML("beforeend", sectionHeader(title));
  txList.insertAdjacentHTML("beforeend", placeholder("Loading…"));

  try {
    const res = await fetch(url);
    const data = await res.json();

    // Remove "Loading…" placeholder
    txList.lastElementChild.remove();

    if (data.status !== "1" || !Array.isArray(data.result) || !data.result.length) {
      txList.insertAdjacentHTML(
        "beforeend",
        placeholder("No data found")
      );
      return;
    }

    data.result.forEach((tx) => {
      txList.insertAdjacentHTML(
        "beforeend",
        parseFn(tx, address)
      );
    });

  } catch (err) {
    console.error(title, err);
    txList.lastElementChild?.remove();
    txList.insertAdjacentHTML(
      "beforeend",
      placeholder("Failed to load")
    );
  }
}

/* ================================
   MASTER FETCH (NON-BLOCKING)
================================ */

function fetchAllTransactions(address) {
  const txList = document.getElementById("txList");
  txList.innerHTML = "";

  // 1️⃣ Normal ETH
  fetchAndRender({
    title: "Normal ETH Transactions",
    address,
    url:
      `https://api.etherscan.io/api` +
      `?module=account&action=txlist` +
      `&address=${address}&page=1&offset=${TX_LIMIT}` +
      `&sort=desc&apikey=${ETHERSCAN_API_KEY}`,
    parseFn: (tx, addr) =>
      renderTx(
        "ETH",
        txDirection(tx.from, addr),
        `${shorten(tx.hash)} · ${parseFloat(tx.value) / 1e18} ETH`,
        tx.timeStamp
      ),
  });

  // 2️⃣ Internal ETH
  fetchAndRender({
    title: "Internal ETH Transactions",
    address,
    url:
      `https://api.etherscan.io/api` +
      `?module=account&action=txlistinternal` +
      `&address=${address}&page=1&offset=${TX_LIMIT}` +
      `&sort=desc&apikey=${ETHERSCAN_API_KEY}`,
    parseFn: (tx, addr) =>
      renderTx(
        "Internal ETH",
        txDirection(tx.from, addr),
        `${shorten(tx.hash)} · ${parseFloat(tx.value) / 1e18} ETH`,
        tx.timeStamp
      ),
  });

  // 3️⃣ ERC-20 Transfers
  fetchAndRender({
    title: "ERC-20 Token Transfers",
    address,
    url:
      `https://api.etherscan.io/api` +
      `?module=account&action=tokentx` +
      `&address=${address}&page=1&offset=${TX_LIMIT}` +
      `&sort=desc&apikey=${ETHERSCAN_API_KEY}`,
    parseFn: (tx, addr) =>
      renderTx(
        tx.tokenSymbol,
        txDirection(tx.from, addr),
        `${tx.value / 10 ** tx.tokenDecimal} ${tx.tokenSymbol}`,
        tx.timeStamp
      ),
  });

  // 4️⃣ NFT Transfers
  fetchAndRender({
    title: "NFT Transfers",
    address,
    url:
      `https://api.etherscan.io/api` +
      `?module=account&action=tokennfttx` +
      `&address=${address}&page=1&offset=${TX_LIMIT}` +
      `&sort=desc&apikey=${ETHERSCAN_API_KEY}`,
    parseFn: (tx, addr) =>
      renderTx(
        tx.tokenSymbol || "NFT",
        txDirection(tx.from, addr),
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

  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  const account = accounts[0];
  walletEl.textContent = shorten(account);

  const chainId = await window.ethereum.request({
    method: "eth_chainId",
  });

  chainEl.textContent = chainId === "0x1" ? "Ethereum Mainnet" : chainId;

  if (chainId !== "0x1") {
    debugEl.textContent = "Switch to Ethereum Mainnet.";
    return;
  }

  const bal = await window.ethereum.request({
    method: "eth_getBalance",
    params: [account, "latest"],
  });

  balanceEl.textContent =
    (parseInt(bal, 16) / 1e18).toFixed(6) + " ETH";

  debugEl.textContent = "Fetching all transaction data…";

  fetchAllTransactions(account);
}

/* ================================
   BOOTSTRAP
================================ */

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectBtn").onclick = connectWallet;
});
