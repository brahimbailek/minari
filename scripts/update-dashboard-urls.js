#!/usr/bin/env node

/**
 * Helper script to update the Test Dashboard with your actual Railway URLs
 *
 * Usage:
 *   node scripts/update-dashboard-urls.js
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const urls = {};

console.log('🔗 Update Test Dashboard URLs');
console.log('==============================');
console.log('');
console.log('Enter your Railway production URLs (press Enter to keep default):');
console.log('');

function ask(question, key) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      urls[key] = answer.trim() || null;
      resolve();
    });
  });
}

async function main() {
  await ask('Auth Service URL: ', 'auth');
  await ask('Numbers Service URL: ', 'numbers');
  await ask('Messaging Service URL: ', 'messaging');
  await ask('Billing Service URL: ', 'billing');
  await ask('Call Service URL: ', 'call');

  rl.close();

  console.log('');
  console.log('📝 Updating app.js...');

  const appJsPath = path.join(__dirname, '../apps/test-dashboard/public/app.js');
  let content = fs.readFileSync(appJsPath, 'utf-8');

  // Build the production URLs object
  const productionUrls = {
    auth: urls.auth || 'https://front-production-9c45.up.railway.app',
    numbers: urls.numbers || 'https://numbers-production.up.railway.app',
    messaging: urls.messaging || 'https://messaging-production.up.railway.app',
    billing: urls.billing || 'https://billing-production.up.railway.app',
    call: urls.call || 'https://call-production.up.railway.app'
  };

  // Replace the production URLs section
  const newProductionUrls = `    // Default production URLs (Railway)
    const productionUrls = {
        'auth': '${productionUrls.auth}',
        'numbers': '${productionUrls.numbers}',
        'messaging': '${productionUrls.messaging}',
        'billing': '${productionUrls.billing}',
        'call': '${productionUrls.call}'
    };`;

  content = content.replace(
    /\/\/ Default production URLs \(Railway\)[\s\S]*?};/,
    newProductionUrls
  );

  fs.writeFileSync(appJsPath, content, 'utf-8');

  console.log('');
  console.log('✅ Dashboard URLs updated!');
  console.log('');
  console.log('Configuration:');
  console.log('  Auth:      ' + productionUrls.auth);
  console.log('  Numbers:   ' + productionUrls.numbers);
  console.log('  Messaging: ' + productionUrls.messaging);
  console.log('  Billing:   ' + productionUrls.billing);
  console.log('  Call:      ' + productionUrls.call);
  console.log('');
  console.log('📦 Commit and push:');
  console.log('  git add apps/test-dashboard/public/app.js');
  console.log('  git commit -m "chore: update dashboard URLs with Railway production"');
  console.log('  git push origin main');
}

main().catch(console.error);
