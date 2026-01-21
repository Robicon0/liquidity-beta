/**
 * Run this in browser console on https://robicon0.github.io/liquidity-beta/
 *
 * Instructions:
 * 1. Open the GitHub Pages URL in your browser
 * 2. Press F12 (or Cmd+Option+I on Mac)
 * 3. Click "Console" tab
 * 4. Copy and paste this entire file
 * 5. Press Enter
 */

console.clear();
console.log('%c🔍 AutoTrack Diagnostic Tool', 'color: #667eea; font-size: 20px; font-weight: bold;');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #667eea;');

// Test 1: URL & Protocol
console.log('\n%c[Test 1] URL & Protocol', 'color: #10b981; font-weight: bold;');
console.log('Current URL:', window.location.href);
console.log('Protocol:', window.location.protocol);
console.log('Status:', window.location.protocol === 'https:' ? '✅ PASS' : '⚠️ WARNING');

// Test 2: Wallet Detection
console.log('\n%c[Test 2] Wallet Detection', 'color: #10b981; font-weight: bold;');
if (typeof window.ethereum !== 'undefined') {
  let walletType = 'Generic Web3';
  if (window.ethereum.isRabby) walletType = 'Rabby 🦊';
  else if (window.ethereum.isMetaMask) walletType = 'MetaMask 🦊';

  console.log('✅ Wallet found:', walletType);
  console.log('   window.ethereum:', '✅ Available');
  console.log('   isRabby:', window.ethereum.isRabby ? '✅ Yes' : '❌ No');
  console.log('   isMetaMask:', window.ethereum.isMetaMask ? '✅ Yes' : '❌ No');
} else {
  console.log('❌ No wallet detected');
  console.log('   Please install Rabby or MetaMask');
}

// Test 3: DOM Elements
console.log('\n%c[Test 3] DOM Elements', 'color: #10b981; font-weight: bold;');
const connectBtn = document.getElementById('connectWalletBtn');
const refreshBtn = document.getElementById('refreshBtn');
const chainIndicator = document.getElementById('chainIndicator');

console.log('connectWalletBtn:', connectBtn ? '✅ Found' : '❌ Not found');
console.log('refreshBtn:', refreshBtn ? '✅ Found' : '❌ Not found');
console.log('chainIndicator:', chainIndicator ? '✅ Found' : '❌ Not found');

if (connectBtn) {
  console.log('   Button text:', connectBtn.textContent);
  console.log('   Button tag:', connectBtn.tagName);
}

// Test 4: Button Styles
console.log('\n%c[Test 4] Button Styles & Clickability', 'color: #10b981; font-weight: bold;');
if (connectBtn) {
  const styles = window.getComputedStyle(connectBtn);
  console.log('pointer-events:', styles.pointerEvents, styles.pointerEvents !== 'none' ? '✅' : '❌');
  console.log('display:', styles.display, styles.display !== 'none' ? '✅' : '❌');
  console.log('visibility:', styles.visibility, styles.visibility !== 'hidden' ? '✅' : '❌');
  console.log('cursor:', styles.cursor);
  console.log('z-index:', styles.zIndex);
  console.log('position:', styles.position);

  const isClickable = styles.pointerEvents !== 'none' &&
                     styles.display !== 'none' &&
                     styles.visibility !== 'hidden';
  console.log('\nButton should be clickable:', isClickable ? '✅ YES' : '❌ NO');
} else {
  console.log('❌ Cannot check - button not found');
}

// Test 5: App Initialization
console.log('\n%c[Test 5] App Initialization', 'color: #10b981; font-weight: bold;');
console.log('window.app exists:', typeof window.app !== 'undefined' ? '✅ Yes' : '❌ No');
if (typeof window.app !== 'undefined') {
  console.log('   App type:', window.app.constructor.name);
  console.log('   Has dashboard:', typeof window.app.dashboard !== 'undefined' ? '✅' : '❌');
  console.log('   Has positionsTable:', typeof window.app.positionsTable !== 'undefined' ? '✅' : '❌');
}

// Test 6: Event Listeners
console.log('\n%c[Test 6] Event Listeners', 'color: #10b981; font-weight: bold;');
if (connectBtn) {
  // Try to click programmatically
  let clickCount = 0;
  const testListener = () => { clickCount++; };

  connectBtn.addEventListener('click', testListener);
  connectBtn.click();
  connectBtn.removeEventListener('click', testListener);

  console.log('Programmatic click test:', clickCount > 0 ? '✅ Works' : '❌ Failed');
  console.log('Click listeners attached:', 'Check if clicking shows console logs');
}

// Test 7: Module Loading
console.log('\n%c[Test 7] Module Loading', 'color: #10b981; font-weight: bold;');
const scripts = document.querySelectorAll('script[type="module"]');
console.log('ES6 Modules found:', scripts.length);
scripts.forEach((script, i) => {
  console.log(`   Module ${i + 1}:`, script.src || 'inline');
});

// Test 8: Check for errors
console.log('\n%c[Test 8] Error Check', 'color: #10b981; font-weight: bold;');
console.log('Check above for any RED errors in console');
console.log('Common errors to look for:');
console.log('  • "Failed to load module" = Path issue');
console.log('  • "CORS error" = Cross-origin issue');
console.log('  • "undefined is not a function" = Module not loaded');

// Summary
console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #667eea;');
console.log('%c📋 SUMMARY', 'color: #667eea; font-size: 16px; font-weight: bold;');

const summary = {
  wallet: typeof window.ethereum !== 'undefined',
  button: !!connectBtn,
  app: typeof window.app !== 'undefined',
  clickable: connectBtn ? window.getComputedStyle(connectBtn).pointerEvents !== 'none' : false
};

console.table(summary);

console.log('\n%c💡 NEXT STEPS:', 'color: #f59e0b; font-weight: bold;');

if (!summary.wallet) {
  console.log('❌ Install Rabby or MetaMask wallet extension');
} else if (!summary.button) {
  console.log('❌ Button not found - Make sure page loaded correctly');
  console.log('   Try refreshing the page (Cmd+Shift+R or Ctrl+Shift+R)');
} else if (!summary.app) {
  console.log('❌ App not initialized - Check for module loading errors above');
  console.log('   Look for red errors in console');
} else if (!summary.clickable) {
  console.log('❌ Button exists but not clickable - CSS issue');
  console.log('   Try hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)');
} else {
  console.log('✅ Everything looks good!');
  console.log('   Try clicking the "Connect Wallet" button in the header');
  console.log('   You should see logs here when you click it');
}

console.log('\n%c🔧 MANUAL TEST:', 'color: #3b82f6; font-weight: bold;');
console.log('Try this command to manually trigger connection:');
console.log('%cwindow.app.connectWallet()', 'background: #000; color: #0f0; padding: 4px 8px; border-radius: 4px;');

console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #667eea;');
