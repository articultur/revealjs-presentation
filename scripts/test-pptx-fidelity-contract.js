#!/usr/bin/env node
'use strict';

const path = require('path');
const registry = require('../references/layout-registry.json');
const strategies = require('../references/pptx-export-strategies.json');
const { analyzeDeckFidelity } = require('./analyze-pptx-fidelity');

const manifest = require(path.join(__dirname, '..', 'tests', 'fixtures', 'deck-manifest-valid.json'));

// 1. Every registered layout must have an export strategy (no silent unknown at the registry level)
const missing = registry.layouts.filter((l) => !strategies.strategies[l.code]);
if (missing.length) {
  console.error('layouts without export strategy: ' + missing.map((l) => l.code).join(','));
  process.exit(1);
}

// 2. The report has one entry per slide and no entry silently degrades to unknown
const report = analyzeDeckFidelity({ manifest });
if (report.slides.length !== manifest.slides.length) {
  console.error('fidelity report must have one entry per slide');
  process.exit(1);
}
for (const s of report.slides) {
  if (!['editable', 'hybrid', 'raster-fallback'].includes(s.strategy)) {
    console.error(`invalid strategy for ${s.slideId}: ${s.strategy}`);
    process.exit(1);
  }
  if (s.warnings.includes('no strategy registered')) {
    console.error(`slide ${s.slideId} silently used unknown adapter`);
    process.exit(1);
  }
}

// 3. Summary counts are consistent
const total = report.summary.editable + report.summary.hybrid + report.summary.rasterFallback;
if (total !== report.slides.length) {
  console.error('summary count mismatch');
  process.exit(1);
}
if (report.summary.unsupported !== 0) {
  console.error('unsupported must be 0 for a manifest with registered archetypes');
  process.exit(1);
}

console.log('PPTX fidelity contract: PASS');
