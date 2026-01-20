console.log("AutoTrack Liquidity – JS loaded");

/* ================================
   Config
================================ */

const ETHERSCAN_API_KEY = "7985AZCNWY5J9K4PB84WR4APQ4UBAPEPCH";
const TX_LIMIT = 10;

const CHAIN_MAP = {
  "0x1": "Ethereum Mainnet",
  "0xa": "Optimism",
  "0xa4b1": "Arbitrum One",
  "0x2105": "Base",
};

const SUPPORTED_CHAINS = Object.keys(CHAIN_MAP);

/* ================================
   Helpers
================================ */

function isSupportedChain(chainId) {
  return SUPPORTED_CHAINS.includes(chainId);
}

function shortenHash(hash) {
  return hash.slice(0, 6) + "…" + hash.slice(-4);
}

function formatTime(unix) {
  return new Date(unix * 1000).toLocaleString();
}

function resetTxList(message) {
  const txList = document.getElementById("txList");
  txList.innerHTML = `<li class="muted">${message}</li>`;
}

/* ================================
   Fetch Transactions (Ethereum)
================================ */

async function fetchTransactions(address) {
  resetTxList("Loading transactions…");

  try {
    const url =
      `https://api.etherscan.io/api` +
      `?module=account` +
      `&action=txlist` +
      `&address=${address}` +
      `&startblock=0` +
      `&endblock=99999999` +
      `&page=1` +
      `&offset=${TX_LIMIT}` +
      `&sort=desc` +
      `&apikey=${ETHERSCAN_API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.result || data.result.length === 0) {
      resetTxList("No transactions found");
      return;
    }

    const txList = document.getElementById("txList");
    txList.innerHTML = "";

    data.result.forEach((tx) => {
      const direction =
        tx.from.toLowerCase() === address.toLowerCase()
          ? "out"
          : "in";

      const li = document.createElement("li");
      li.className = direction;

      li.innerHTML = `
        <div>${shortenHash(tx.hash)}</div>
        <span>${formatTime(tx.timeStamp)}</span>
      `;

      txList.appendChild(li);
    });

  } catch (err) {
    console.error(err);
    resetTxList("Failed to load transactions");
  }
}

/* ================================
   Wallet Logic
================================ */

async function connectWallet(state) {
  const {
    walletEl,
    chainEl,
    balanceEl,
    debugEl,
    connectBtn,
  } = state;

  try {
    debugEl.textContent = "Connecting wallet…";

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts.length) {
      debugEl.textContent = "No wallet connected.";
      return;
    }

    const account = accounts[0];
    walletEl.textContent =
      account.slice(0, 6) + "…" + account.slice(-4);

    const chainId = await window.ethereum.request({
      method: "eth_chainId",
    });

    const supported = isSupportedChain(chainId);
    const chainName = supported
      ? CHAIN_MAP[chainId]
      : `Unsupported (${chainId})`;

    chainEl.textContent = chainName;

    if (chainId !== "0x1") {
      debugEl.textContent =
        "Transaction view available only on Ethereum (for now).";
      balanceEl.textContent = "–";
      resetTxList("Switch to Ethereum to view transactions");
      return;
    }

    const balance = await window.ethereum.request({
      method: "eth_getBalance",
      params: [account, "latest"],
    });

    balanceEl.textContent =
      (parseInt(balance, 16) / 1e18).toFixed(4) + " ETH";

    debugEl.textContent = "Wallet connected. Fetching transactions…";

    fetchTransactions(account);

  } catch (err) {
    console.error(err);
    debugEl.textContent = "Wallet connection failed.";
  }
}

/* ================================
   Bootstrap + Live Events
================================ */

document.addEventListener("DOMContentLoaded", () => {
  const state = {
    connectBtn: document.getElementById("connectBtn"),
    walletEl: document.getElementById("wallet"),
    chainEl: document.getElementById("chain"),
    balanceEl: document.getElementById("balance"),
    debugEl: document.querySelector(".debug p"),
  };

  if (!window.ethereum) {
    state.debugEl.textContent = "MetaMask not detected.";
    state.connectBtn.disabled = true;
    return;
  }

  state.debugEl.textContent = "MetaMask detected. Ready.";

  state.connectBtn.onclick = () => connectWallet(state);

  window.ethereum.on("accountsChanged", () => connectWallet(state));
  window.ethereum.on("chainChanged", () => connectWallet(state));
});
