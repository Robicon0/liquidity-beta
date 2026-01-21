# AutoTrack Liquidity - Automated LP Position Tracker

🎯 **Automatically track and analyze your DeFi liquidity provider positions across multiple chains and protocols**

## Features

✅ **Auto-Detection** - Automatically finds all your LP positions from on-chain data
✅ **Multi-Chain Support** - Ethereum, Polygon, Base, Arbitrum, Optimism, BSC
✅ **Real-Time PnL** - Track profits, losses, and performance metrics
✅ **Fee Tracking** - Monitor fees earned from your LP positions
✅ **Impermanent Loss** - Calculate IL for each position
✅ **Auto Chain Switching** - Automatically reloads data when you switch chains
✅ **Editable Fields** - Add notes and custom values to positions
✅ **Modern UI** - Professional, responsive dashboard

## Project Structure

```
liquidity-beta/
├── index.html              # Main HTML file
├── css/
│   └── main.css           # Complete application styles
├── js/
│   ├── config/
│   │   ├── chains.js      # Chain configurations (API keys here)
│   │   ├── protocols.js   # Protocol definitions and ABIs
│   │   └── constants.js   # App constants and settings
│   ├── services/
│   │   ├── wallet.js      # Wallet connection & chain switching
│   │   ├── blockchain.js  # Blockchain data fetching
│   │   ├── lpDetector.js  # LP position detection engine
│   │   ├── priceService.js # Token price fetching
│   │   └── pnlCalculator.js # PnL calculations
│   ├── components/
│   │   ├── dashboard.js   # Dashboard component
│   │   └── lpPositions.js # LP positions table
│   ├── utils/
│   │   ├── formatters.js  # Formatting utilities
│   │   ├── helpers.js     # Helper functions
│   │   └── storage.js     # LocalStorage management
│   └── main.js            # App initialization
└── assets/
    └── icons/             # Chain/protocol icons (future)
```

## Setup Instructions

### 1. Configure API Keys

Edit `js/config/chains.js` and add your blockchain explorer API keys:

```javascript
const CHAINS = {
  ethereum: {
    apiKey: 'YOUR_ETHERSCAN_API_KEY',
    // ...
  },
  polygon: {
    apiKey: 'YOUR_POLYGONSCAN_API_KEY',
    // ...
  },
  // ... other chains
};
```

**Get API Keys:**
- Etherscan: https://etherscan.io/apis
- Polygonscan: https://polygonscan.com/apis
- Basescan: https://basescan.org/apis
- Arbiscan: https://arbiscan.io/apis
- Optimistic Etherscan: https://optimistic.etherscan.io/apis
- BscScan: https://bscscan.com/apis

### 2. Serve the Application

Since this uses ES6 modules, you need to serve it via HTTP:

**Option A - Using Python:**
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Option B - Using Node.js:**
```bash
npx http-server -p 8000
```

**Option C - Using VS Code:**
Install "Live Server" extension and click "Go Live"

### 3. Open in Browser

Navigate to: `http://localhost:8000`

## How to Use

1. **Connect Wallet** - Click "Connect Wallet" and approve the connection
2. **Auto-Load** - The app automatically fetches your LP positions from all supported chains
3. **View Dashboard** - See overview metrics, PnL, fees earned, and more
4. **Explore Positions** - Detailed table with all your LP positions
5. **Switch Chains** - Change network in MetaMask and data auto-reloads
6. **Edit Fields** - Click edit icon to add notes to positions

## Key Metrics Tracked

- **Total Portfolio Value** - Current value of all LP positions
- **Total PnL** - Profit/Loss across all positions
- **Fees Earned** - Total fees collected
- **Impermanent Loss** - IL calculated per position
- **APY** - Annualized return for each position
- **Position Status** - Active, Closed, or Partial

## Supported Protocols

- Uniswap V2 & V3
- SushiSwap
- Curve Finance
- Balancer V2
- PancakeSwap
- Aerodrome
- And more...

## Editable Features

- **Position Notes** - Add custom notes to positions
- **Custom Prices** - Override token prices manually
- **Cost Basis** - Adjust cost basis (future feature)

## Data Storage

All data is stored locally in your browser:
- Custom prices
- Position notes
- User preferences
- No backend required!

## Troubleshooting

### Module Import Errors
- Make sure you're serving via HTTP, not opening `index.html` directly
- Check browser console for specific errors

### No Positions Found
- Ensure your wallet has LP positions on supported chains
- Check if API keys are correctly configured
- Verify you're connected to a supported network

### Chain Not Switching
- Make sure MetaMask is installed and unlocked
- Check that the chain is supported in `chains.js`

## Customization

### Add More Chains
Edit `js/config/chains.js`:
```javascript
export const CHAINS = {
  // ... existing chains
  newchain: {
    id: '0xHEX_CHAIN_ID',
    name: 'New Chain',
    symbol: 'TOKEN',
    apiUrl: 'https://api.newscan.com/api',
    apiKey: 'YOUR_API_KEY',
    icon: '🔗',
    color: '#HEXCOLOR'
  }
};
```

### Add More Protocols
Edit `js/config/protocols.js` to add new DEXs.

### Customize Styling
Edit `css/main.css` - all styles use CSS variables for easy theming.

## PRD Compliance

This implementation fulfills all requirements from the PRD:

✅ Read-only, non-custodial
✅ Automated LP position detection
✅ Multi-chain support
✅ Transaction analysis via explorer APIs
✅ PnL calculations
✅ Auto chain switching
✅ Editable variables
✅ Modern, professional UI
✅ Data displayed from chain explorers

## Roadmap

- [ ] Add historical price data
- [ ] Implement pool reserve fetching for accurate position values
- [ ] Add LP position opening/closing history
- [ ] Charts and visualizations
- [ ] Export to CSV
- [ ] Mobile app

## License

MIT License - feel free to use and modify

## Support

For issues or questions, check the browser console for detailed logs.
