'use strict';

// Additive patch only: never replaces an existing server.js.
// Run from ARDNET_Backend: node scripts/installSoapRoute.js
const fs = require('fs');
const path = require('path');
const serverFile = path.resolve(process.cwd(), 'src/server.js');
const anchor = "console.log('Routes mounted successfully');";
const signature = 'ARDNET_SOAP_MARKET_PRICES_ROUTE_V1';

if (!fs.existsSync(serverFile)) {
  console.error('Unable to find src/server.js. Run from the ARDNET_Backend directory.');
  process.exit(1);
}
const original = fs.readFileSync(serverFile, 'utf8');
if (original.includes(signature)) {
  console.log('SOAP route already installed. No changes made.');
  process.exit(0);
}
if (original.split(anchor).length !== 2) {
  console.error('Expected unique server.js route anchor not found. No changes made; use README manual installation.');
  process.exit(1);
}
const injection = [
  '',
  '// ARDNET_SOAP_MARKET_PRICES_ROUTE_V1 — read-only SOAP 1.1, no WSDL',
  "if (String(process.env.SOAP_MARKET_PRICES_ENABLED || '').toLowerCase() === 'true') {",
  "  const { createSoapMarketPricesRouter } = require('./routes/soapMarketPrices');",
  "  app.use('/soap/market-prices', createSoapMarketPricesRouter(pool));",
  "  console.log('[ARDNET SOAP] Read-only market-price service enabled at /soap/market-prices');",
  '}',
  '',
].join('\n');

// Keep a dated local backup of the complete current server file.
const date = new Date().toISOString().replace(/[:.]/g, '-');
const backup = `${serverFile}.pre-soap-${date}.bak`;
fs.copyFileSync(serverFile, backup, fs.constants.COPYFILE_EXCL);
try {
  fs.writeFileSync(serverFile, original.replace(anchor, `${anchor}${injection}`), 'utf8');
  console.log(`SOAP route installed. Previous server.js saved to: ${backup}`);
} catch (error) {
  fs.copyFileSync(backup, serverFile);
  throw error;
}
