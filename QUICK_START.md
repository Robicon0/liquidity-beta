# 🚀 Quick Start Guide

## The buttons aren't working? Here's why:

**The app MUST be served via HTTP, not opened directly!**

❌ **WRONG:** Opening `index.html` by double-clicking it
✅ **CORRECT:** Running a local server

---

## How to Fix It (Choose ONE method):

### Method 1: Use the Start Script (Easiest)

```bash
cd /Users/johnnyarya/Documents/liquidity-beta
./START.sh
```

Then open browser to: **http://localhost:8000**

---

### Method 2: Python (Manual)

```bash
cd /Users/johnnyarya/Documents/liquidity-beta

# Python 3
python3 -m http.server 8000

# OR Python 2
python -m SimpleHTTPServer 8000
```

Then open browser to: **http://localhost:8000**

---

### Method 3: Node.js

```bash
cd /Users/johnnyarya/Documents/liquidity-beta
npx http-server -p 8000
```

Then open browser to: **http://localhost:8000**

---

### Method 4: VS Code Live Server

1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

---

## How to Check if It's Working

Open browser console (`F12` or `Cmd+Option+I` on Mac) and you should see:

```
🎯 AutoTrack Main Script Loading...
🎯 AutoTrack App Constructor
🎯 AutoTrack Liquidity - Initializing...
📌 Setting up event listeners...
✅ Found connect button
✅ Event listeners setup complete
✅ Application initialized
```

If you see these logs, the buttons will work!

---

## Still Not Working?

### Check for Errors in Console

1. Open browser at http://localhost:8000
2. Press `F12` (or `Cmd+Option+I` on Mac)
3. Click "Console" tab
4. Look for RED errors
5. Share the error messages

### Common Errors:

**"Cross-origin request blocked"** = You're not using a server
**"Failed to load module"** = File paths are wrong or server not running
**"Cannot find element"** = JavaScript loaded before HTML (already fixed)

---

## Next Step: Add API Keys

After the buttons work, you need to add your API keys:

Edit: `js/config/chains.js`

Replace `'YourPolygonAPIKey'` with actual keys from:
- etherscan.io/apis
- polygonscan.com/apis
- basescan.org/apis
- etc.

---

## Test Connection

Once server is running:

1. Click "Connect Wallet" button
2. You should see MetaMask popup
3. Approve the connection
4. App will load your LP positions

---

## Need More Help?

Check the browser console for detailed logs. Every action is logged with emojis:

- 🔗 = Connecting
- ✅ = Success
- ❌ = Error
- 📊 = Loading data
- 🔘 = Button clicked
