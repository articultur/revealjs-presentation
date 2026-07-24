#!/usr/bin/env node
'use strict';

const path = require('path');
const {
  loadDeckManifest,
  validateDeckManifest,
  manifestToGeneratorInput,
} = require('./deck-manifest');

const root = path.resolve(__dirname, '..');
const valid = loadDeckManifest(path.join(root, 'tests/fixtures/deck-manifest-valid.json'));
const invalid = loadDeckManifest(path.join(root, 'tests/fixtures/deck-manifest-invalid.json'));

const validResult = validateDeckManifest(valid);
if (!validResult.ok) {
  console.error(validResult.errors.join('\n'));
  process.exit(1);
}

const invalidResult = validateDeckManifest(invalid);
if (invalidResult.ok) {
  console.error('invalid fixture must fail validation');
  process.exit(1);
}

const generatorInput = manifestToGeneratorInput(valid);
if (generatorInput.topic !== valid.topic || generatorInput.sections.length !== valid.slides.length) {
  console.error('manifest conversion lost topic or slides');
  process.exit(1);
}

if (generatorInput.sections[1].content_type !== 'data-anchor') {
  console.error('contentType must map to content_type');
  process.exit(1);
}

console.log('Deck Manifest contract: PASS');
