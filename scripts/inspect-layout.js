#!/usr/bin/env node
'use strict';

const { getLayout } = require('./layout-registry');

const code = process.argv[2];
if (!code) {
  console.error('Usage: node scripts/inspect-layout.js <A1..A12|IMG>');
  process.exit(2);
}

const layout = getLayout(code.toUpperCase());
if (!layout) {
  console.error(`unknown layout: ${code}`);
  process.exit(2);
}

console.log(JSON.stringify(layout, null, 2));
