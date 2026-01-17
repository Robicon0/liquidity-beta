console.log("AutoTrack Liquidity – JS loaded");

document.addEventListener("DOMContentLoaded", () => {
  const connectBtn = document.getElementById("connectBtn");
  const walletEl = document.getElementById("wallet");
  const chainEl = document.getElementById("chain");
  const balanceEl = document.getElementById("balance");
  const debugEl = document.querySelector(".debug p");

  if (!window.ethereum) {
    debugEl.textContent = "MetaMask not detected.";
    return;
  }

  debugEl.textContent = "MetaMask detected. Ready to connect.";

  connectBtn.addEventListener("click", async () => {
    try {
      debugEl.textContent = "Requesting wallet connection…";

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });

      const account = accounts[0];
      walletEl.textContent =
        account.slice(0, 6) + "…" + account.slice(-4);

      const chainId = await window.ethereum.request({
        method: "eth_chainId"
      });

      chainEl.textContent = chainId;

      const balance = await window.ethereum.request({
        method: "eth_getBalance",
        params: [account, "latest"]
      });

      const ethBalance =
        parseInt(balance, 16) / 1e18;

      balanceEl.textContent = ethBalance.toFixed(4) + " ETH";

      debugEl.textContent = "Wallet connected successfully.";

      console.log("Connected account:", account);
      console.log("Chain ID:", chainId);
      console.log("Balance (ETH):", ethBalance);

    } catch (err) {
      console.error(err);
      debugEl.textContent = "Connection rejected or failed.";
    }
  });
});
