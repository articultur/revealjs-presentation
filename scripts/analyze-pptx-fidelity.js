#!/usr/bin/env node
'use strict';

const strategies = require('../references/pptx-export-strategies.json');
const registry = require('../references/layout-registry.json');

const VALID_MODES = new Set(['editable', 'hybrid', 'raster-fallback']);

function analyzeDeckFidelity({ manifest, html }) {
  const layoutByCode = new Map(registry.layouts.map((l) => [l.code, l]));
  const slides = manifest.slides.map((s) => {
    const code = s.archetype;
    const strat = strategies.strategies[code] || { mode: 'raster-fallback', adapter: 'unknown' };
    const layout = layoutByCode.get(code);
    const warnings = [];
    if (strat.adapter === 'unknown') warnings.push('no strategy registered');
    if (html && Array.isArray(html)) {
      // optional: html is an array of { slideId, dataArchetype } for cross-check
      const rec = html.find((h) => h.slideId === s.id);
      if (rec && rec.dataArchetype && rec.dataArchetype !== code) {
        warnings.push(`data-archetype (${rec.dataArchetype}) differs from manifest (${code})`);
      }
    }
    return {
      slideId: s.id,
      archetype: code,
      strategy: strat.mode,
      adapter: strat.adapter,
      editableObjects: layout ? layout.requiredProps.slice() : [],
      rasterObjects: strat.mode === 'hybrid' ? ['complex-visual'] : [],
      warnings,
    };
  });
  const summary = {
    editable: slides.filter((s) => s.strategy === 'editable').length,
    hybrid: slides.filter((s) => s.strategy === 'hybrid').length,
    rasterFallback: slides.filter((s) => s.strategy === 'raster-fallback').length,
    unsupported: slides.filter((s) => s.warnings.includes('no strategy registered')).length,
  };
  return { version: 1, deckId: manifest.deckId, summary, slides };
}

if (require.main === module) {
  const path = require('path');
  const manifest = require(path.resolve(process.argv[2] || 'tests/fixtures/deck-manifest-valid.json'));
  const report = analyzeDeckFidelity({ manifest });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

module.exports = { analyzeDeckFidelity };
