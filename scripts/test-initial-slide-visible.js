#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const root = path.resolve(__dirname, '..');

// Accept file argument(s); if none given, fall back to seed-template list
// for backward-compatible CI runs.
const args = process.argv.slice(2);
const fallbackFiles = [
  'examples/template-01-editorial-serif.html',
  'examples/template-02-dark-tech.html',
  'examples/template-03-minimal-spatial.html',
  'examples/template-04-vibrant-gradient.html',
  'examples/template-05-nature-fresh.html',
  'tests/fixtures/public-ready-patterns.html',
];

let files;
if (args.length > 0) {
  files = args;
} else {
  files = fallbackFiles;
}

const failures = [];

function hasFragmentClass($, el) {
  let current = el;
  while (current && current.length) {
    const klass = current.attr('class') || '';
    if (/\bfragment\b/.test(klass)) return true;
    current = current.parent();
  }
  return false;
}

for (const file of files) {
  // 相对路径解析：先按 cwd（用户/agent 传入的相对路径），再按 skill 根（无参 fallback 的种子模板）。
  // 旧逻辑统一 path.join(root, file) 会让 agent 在 outputs 目录传 "deck.html" 时去 skill 根找 → file not found。
  let absPath;
  if (path.isAbsolute(file)) {
    absPath = file;
  } else {
    const fromCwd = path.resolve(process.cwd(), file);
    absPath = fs.existsSync(fromCwd) ? fromCwd : path.join(root, file);
  }
  if (!fs.existsSync(absPath)) {
    failures.push(`${file}: file not found`);
    continue;
  }
  const html = fs.readFileSync(absPath, 'utf8');
  const $ = cheerio.load(html);
  const firstSlide = $('.slides > section').first();
  const visibleHeading = firstSlide.find('h1, h2').filter((_i, node) => {
    const el = $(node);
    return !hasFragmentClass($, el) && el.text().trim().length > 0;
  });

  if (visibleHeading.length === 0) {
    failures.push(`${file}: first slide must show a non-fragment h1/h2 on initial open.`);
  }
}

if (failures.length) {
  console.error('Initial slide visibility contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Initial slide visibility contract passed.');
