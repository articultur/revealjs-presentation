#!/usr/bin/env node
'use strict';

const { queryLayouts } = require('./layout-registry');

const args = process.argv.slice(2);
const filters = {};
const out = { json: false };

for (let i = 0; i < args.length; i++) {
  const k = args[i];
  if (k === '--json') out.json = true;
  else if (k === '--role') filters.role = args[++i];
  else if (k === '--content-type') filters.contentType = args[++i];
  else if (k === '--needs-media') filters.needsMedia = true;
  else if (k === '--pptx-strategy') filters.pptxStrategy = args[++i];
  else { console.error(`unknown flag: ${k}`); process.exit(2); }
}

const result = queryLayouts(filters);
if (out.json) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  result.forEach((layout) => {
    console.log(`${layout.code}\t${layout.contentType}\t${layout.roles.join(',')}\t${layout.pptxStrategy}`);
  });
}
