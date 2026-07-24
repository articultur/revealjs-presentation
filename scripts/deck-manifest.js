#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const CONTENT_TYPES = new Set([
  'cover', 'thesis', 'chronology', 'chapter', 'data-anchor', 'comparison',
  'kpi', 'mechanism', 'evidence-table', 'quote', 'takeaways', 'closing',
  'image-compare',
]);
const ARCHETYPES = new Set([
  'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7',
  'A8', 'A9', 'A10', 'A11', 'A12', 'IMG',
]);
const MOTION_INTENTS = new Set(['none', 'fragment', 'loop', 'count-in', 'draw', 'grow']);

function loadDeckManifest(filePath) {
  const absolute = path.resolve(filePath);
  return JSON.parse(fs.readFileSync(absolute, 'utf8'));
}

function normalizeDeckManifest(input) {
  return JSON.parse(JSON.stringify(input));
}

function validateDeckManifest(manifest) {
  const errors = [];
  const requiredStrings = ['deckId', 'title', 'topic', 'audience', 'language', 'voice'];
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return { ok: false, errors: ['manifest must be an object'] };
  }
  if (manifest.manifestVersion !== '1.0') errors.push('manifestVersion must equal "1.0"');
  for (const key of requiredStrings) {
    if (typeof manifest[key] !== 'string' || !manifest[key].trim()) {
      errors.push(`${key} must be a non-empty string`);
    }
  }
  if (!manifest.route || !['A', 'B', 'C'].includes(manifest.route.path)) {
    errors.push('route.path must be A, B, or C');
  }
  if (!manifest.output || typeof manifest.output.html !== 'string' || !manifest.output.html.trim()) {
    errors.push('output.html must be a non-empty string');
  }
  if (!Array.isArray(manifest.slides) || manifest.slides.length === 0) {
    errors.push('slides must contain at least one slide');
  } else {
    const ids = new Set();
    manifest.slides.forEach((slide, index) => {
      const prefix = `slides[${index}]`;
      if (!slide.id || typeof slide.id !== 'string') errors.push(`${prefix}.id is required`);
      if (slide.id && ids.has(slide.id)) errors.push(`${prefix}.id must be unique`);
      if (slide.id) ids.add(slide.id);
      if (!CONTENT_TYPES.has(slide.contentType)) errors.push(`${prefix}.contentType is invalid`);
      if (!ARCHETYPES.has(slide.archetype)) errors.push(`${prefix}.archetype is invalid`);
      if (!slide.proofObject || typeof slide.proofObject.claim !== 'string' || !slide.proofObject.claim.trim()) {
        errors.push(`${prefix}.proofObject.claim is required`);
      }
      if (!MOTION_INTENTS.has(slide.motionIntent)) errors.push(`${prefix}.motionIntent is invalid`);
      if (!slide.props || typeof slide.props !== 'object' || Array.isArray(slide.props)) {
        errors.push(`${prefix}.props must be an object`);
      }
      if (!Array.isArray(slide.mediaSlots)) errors.push(`${prefix}.mediaSlots must be an array`);
      if (!Array.isArray(slide.evidence)) errors.push(`${prefix}.evidence must be an array`);
    });
  }
  return { ok: errors.length === 0, errors };
}

function manifestToGeneratorInput(manifest) {
  const result = validateDeckManifest(manifest);
  if (!result.ok) throw new Error(result.errors.join('\n'));
  return {
    topic: manifest.topic,
    voice: manifest.voice,
    sections: manifest.slides.map((slide) => ({
      ...slide.props,
      id: slide.id,
      role: slide.role,
      title: slide.props.title || slide.proofObject.claim,
      content_type: slide.contentType,
      variant_params: slide.variantParams,
      evidence: slide.evidence,
      evidence_status: slide.evidence[0] && slide.evidence[0].status || 'illustrative',
      media_slots: slide.mediaSlots,
      motion_intent: slide.motionIntent,
    })),
  };
}

function writeDeckManifest(filePath, manifest) {
  const result = validateDeckManifest(manifest);
  if (!result.ok) throw new Error(result.errors.join('\n'));
  const absolute = path.resolve(filePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  const temporary = `${absolute}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.renameSync(temporary, absolute);
}

module.exports = {
  loadDeckManifest,
  normalizeDeckManifest,
  validateDeckManifest,
  manifestToGeneratorInput,
  writeDeckManifest,
};
