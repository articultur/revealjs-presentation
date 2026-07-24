#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const registryPath = path.join(__dirname, '..', 'references', 'layout-registry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

function getLayout(code) {
  return registry.layouts.find((layout) => layout.code === code) || null;
}

function queryLayouts(filters = {}) {
  return registry.layouts.filter((layout) => {
    if (filters.role && !layout.roles.includes(filters.role)) return false;
    if (filters.contentType && layout.contentType !== filters.contentType) return false;
    if (filters.needsMedia && layout.mediaSlots.length === 0) return false;
    if (filters.pptxStrategy && layout.pptxStrategy !== filters.pptxStrategy) return false;
    return true;
  });
}

function validateLayoutRegistry() {
  const errors = [];
  const codes = new Set();
  for (const layout of registry.layouts) {
    if (!layout.code || codes.has(layout.code)) errors.push(`duplicate or missing code: ${layout.code}`);
    codes.add(layout.code);
    if (!layout.contentType) errors.push(`${layout.code}.contentType is required`);
    if (!Array.isArray(layout.roles) || layout.roles.length === 0) errors.push(`${layout.code}.roles is required`);
    if (!Array.isArray(layout.requiredProps)) errors.push(`${layout.code}.requiredProps must be an array`);
    if (!Array.isArray(layout.optionalProps)) errors.push(`${layout.code}.optionalProps must be an array`);
    if (!Array.isArray(layout.forbiddenProps)) errors.push(`${layout.code}.forbiddenProps must be an array`);
    if (!Array.isArray(layout.mediaSlots)) errors.push(`${layout.code}.mediaSlots must be an array`);
    if (!['editable', 'hybrid', 'raster-fallback'].includes(layout.pptxStrategy)) {
      errors.push(`${layout.code}.pptxStrategy is invalid`);
    }
  }
  return { ok: errors.length === 0, errors };
}

module.exports = { getLayout, queryLayouts, validateLayoutRegistry };
