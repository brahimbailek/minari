#!/usr/bin/env node

/**
 * Generate a 256-bit encryption key for Messaging Service
 */

const crypto = require('crypto');

console.log('🔐 Generating 256-bit Encryption Key...\n');

const key = crypto.randomBytes(32).toString('hex');

console.log('✅ Key generated:\n');
console.log(key);
console.log('\n📋 Add this to Railway Variables:');
console.log(`ENCRYPTION_KEY=${key}`);
console.log('\n⚠️  Keep this key secret and never commit it to git!');
