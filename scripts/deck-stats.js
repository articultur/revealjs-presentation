#!/usr/bin/env node
'use strict';

/**
 * deck-stats.js — read-only reveal.js deck inspection CLI.
 * Prints a JSON summary of one or more deck HTML files to stdout.
 *
 * Usage:
 *   node scripts/deck-stats.js <file.html> [<file.html> ...]
 *   node scripts/deck-stats.js --help
 */

const fs = require('fs');
const path = require('path');

const USAGE = 'usage: node scripts/deck-stats.js <file.html> [<file.html> ...]';

function failUsage(code) {
  console.error(USAGE);
  process.exit(code);
}

const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.error(USAGE);
  process.exit(0);
}
if (args.length === 0) {
  failUsage(1);
}

const cheerio = require('cheerio');

function statsFor(filePath) {
  const basename = path.basename(filePath);
  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch (e) {
    return { file: filePath, error: e.message };
  }
  let html;
  try {
    html = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return { file: basename, error: e.message };
  }
  const $ = cheerio.load(html);
  const slides = $('.reveal .slides > section').length;
  const tables = $('[data-table]').length;
  const backgrounds = $('[data-background]').length;
  // Export button is JS-injected (document.createElement + btn.id='pptx-export-btn'),
  // so cheerio's static parse can't see it. Search <script> content instead,
  // matching the precedent in scripts/test-off-template-regression.js.
  const scriptText = $('script').map((_, el) => $(el).html() || '').get().join('\n');
  const hasExportButton = /btn\.id\s*=\s*['"]pptx-export-btn['"]/.test(scriptText);
  const hasInkTheme = $('[data-ink]').length > 0;
  return {
    file: basename,
    slides,
    tables,
    backgrounds,
    hasExportButton,
    hasInkTheme,
    bytes: stat.size,
  };
}

const results = args.map(statsFor);
const hasError = results.some(r => r.error);
const output = results.length === 1 ? results[0] : results;
process.stdout.write(JSON.stringify(output, null, 2) + '\n');
if (hasError) process.exit(1);
