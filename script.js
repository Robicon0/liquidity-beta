console.log("AutoTrack Liquidity – JS loaded");

/* ================================
   Chain Configuration
================================ */

const CHAIN_MAP = {
  "0x1": "Ethereum Mainnet",
  "0xa": "Optimism",
  "0xa4b1": "Arbitrum One",
  "0x2105": "Base",
};

const SUPPORTED_CHAINS = Object.keys(CHAIN_MAP);

function isSupportedChain(chainId) {
  return SUPPORTED_CHAINS.includes(chainId);
}

/* ================================
   UI Helpers
================================ */

function resetUI(walletEl, chainEl, balanceEl, debugEl, connectBtn) {
  walletEl.textContent = "Not connected";
  chainEl.textContent = "–";
  balanceEl.textContent = "–";
  debugEl.textContent = "Wallet disconnected.";
  connectBtn.disabled = false;
}

/* ================================
   Core Logic
================================ */

async function connectWallet({
  walletEl,
  chainEl,
  balanceEl,
  debugEl,
  connectBtn,
}) {
  try {
    debugEl.textContent = "Requesting wallet connection…";

    /* ---- Account ---- */
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || !accounts.length) {
      resetUI(walletEl, chainEl, balanceEl, debugEl, connectBtn);
      return;
    }

    const account = accounts[0];
    walletEl.textContent =
      account.slice(0, 6) + "…" + account.slice(-4);

    /* ---- Chain ---- */
    const chainId = await window.ethereum.request({
      method: "eth_chainId",
    });

    const supported = isSupportedChain(chainId);
    const chainName = supported
      ? CHAIN_MAP[chainId]
      : `Unsupported (${chainId})`;

    chainEl.textContent = chainName;

    if (!supported) {
      balanceEl.textContent = "–";
      connectBtn.disabled = true;
      debugEl.textContent =
        "Unsupported network. Please switch to Ethereum, Arbitrum, Optimism, or Base.";
      return;
    }

    connectBtn.disabled = false;

    /* ---- Balance ---- */
    const balance = await window.ethereum.request({
      method: "eth_getBalance",
      params: [account, "latest"],
    });

    const ethBalance = parseInt(balance, 16) / 1e18;
    balanceEl.textContent = ethBalance.toFixed(4) + " ETH";

    debugEl.textContent = "Wallet connected and synced.";

    console.log("Connected account:", account);
    console.log("Chain ID:", chainId);
    console.log("Balance (ETH):", ethBalance);
  } catch (err) {
    console.error(err);
    debugEl.textContent = "Wallet connection failed.";
  }
}

/* ================================
   App Bootstrap
================================ */

document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectBtn");
  const walletEl = document.getElementById("wallet");
  const chainEl = document.getElementById("chain");
  const balanceEl = document.getElementById("balance");
  const debugEl = document.querySelector(".debug p");

  if (!window.ethereum) {
    debugEl.textContent = "MetaMask not detected.";
    connectBtn.disabled = true;
    return;
  }

  debugEl.textContent = "MetaMask detected. Ready.";

  /* ---- Initial Connect ---- */
  connectBtn.addEventListener("click", () =>
    connectWallet({
      walletEl,
      chainEl,
      balanceEl,
      debugEl,
      connectBtn,
    })
  );

  /* ================================
     MetaMask Live Events
  ================================ */

  window.ethereum.on("accountsChanged", (accounts) => {
    if (!accounts.length) {
      resetUI(walletEl, chainEl, balanceEl, debugEl, connectBtn);
    } else {
      connectWallet({
        walletEl,
        chainEl,
        balanceEl,
        debugEl,
        connectBtn,
      });
    }
  });

  window.ethereum.on("chainChanged", () => {
    connectWallet({
      walletEl,
      chainEl,
      balanceEl,
      debugEl,
      connectBtn,
    });
  });
});
