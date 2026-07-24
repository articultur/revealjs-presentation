#!/usr/bin/env node
'use strict';

const path = require('path');
const { loadDeckManifest, validateDeckManifest } = require('./deck-manifest');

const root = path.resolve(__dirname, '..');

// Valid fixture (user-provided evidence with a note) must still pass strict evidence rules.
const valid = loadDeckManifest(path.join(root, 'tests/fixtures/deck-manifest-valid.json'));
const vr = validateDeckManifest(valid);
if (!vr.ok) {
  console.error('valid fixture must pass strict evidence validation:\n' + vr.errors.join('\n'));
  process.exit(1);
}

// Fixture with a verified evidence item missing its source must fail, citing source.
const evInvalid = loadDeckManifest(path.join(root, 'tests/fixtures/deck-manifest-evidence-invalid.json'));
const er = validateDeckManifest(evInvalid);
if (er.ok) {
  console.error('verified evidence without source must fail validation');
  process.exit(1);
}
if (!er.errors.some((e) => /source/.test(e))) {
  console.error('failure must cite source in errors:\n' + er.errors.join('\n'));
  process.exit(1);
}

console.log('Evidence sources contract: PASS');
