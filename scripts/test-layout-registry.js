#!/usr/bin/env node
'use strict';

const { ARCHETYPE_MAP } = require('./content-router');
const { getLayout, queryLayouts, validateLayoutRegistry } = require('./layout-registry');

const result = validateLayoutRegistry();
if (!result.ok) {
  console.error(result.errors.join('\n'));
  process.exit(1);
}

for (const [contentType, entry] of Object.entries(ARCHETYPE_MAP)) {
  const layout = getLayout(entry.code);
  if (!layout || layout.contentType !== contentType) {
    console.error(`registry mismatch for ${contentType}/${entry.code}`);
    process.exit(1);
  }
}

const mediaLayouts = queryLayouts({ needsMedia: true });
if (!mediaLayouts.some((layout) => layout.code === 'IMG')) {
  console.error('media query must include IMG');
  process.exit(1);
}

const proofLayouts = queryLayouts({ role: 'proof' });
if (!proofLayouts.some((layout) => layout.code === 'A5')) {
  console.error('proof query must include A5');
  process.exit(1);
}

console.log('Layout registry contract: PASS');
