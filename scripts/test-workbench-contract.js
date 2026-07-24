#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'workbench', 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'workbench', 'app.js'), 'utf8');
const $ = cheerio.load(html);

const errors = [];

const requiredIds = [
  'deck-title', 'route-summary', 'slide-list', 'property-panel',
  'media-panel', 'evidence-panel', 'qa-status', 'preview-frame', 'save-status',
];
for (const id of requiredIds) {
  const n = $(`#${id}`).length;
  if (n !== 1) errors.push(`expected exactly one #${id}, found ${n}`);
}

if ($('[contenteditable]').length > 0) {
  errors.push('free contenteditable is forbidden — use registry-driven form controls');
}

if (!/If-Match/i.test(appJs)) errors.push('app.js must use If-Match for optimistic concurrency');
if (!/500/.test(appJs)) errors.push('app.js must debounce saves (~500ms)');
if (/\beval\s*\(/.test(appJs)) errors.push('app.js must not use eval');
if (/new Function/.test(appJs)) errors.push('app.js must not use new Function');
if (/innerHTML\s*=/.test(appJs)) errors.push('app.js must not assign innerHTML — use textContent/createElement');
if (!/updateSlideProp/.test(appJs)) errors.push('app.js must define updateSlideProp');
if (!/allowedKeys|allowedProps/.test(appJs)) errors.push('app.js must gate prop edits through a registry-derived allow-list');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Workbench UI contract: PASS');
