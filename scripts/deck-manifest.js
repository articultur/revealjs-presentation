#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { validateBrief } = require('./check-design-brief.js');

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
  // designBrief 可选:存在时必须是完整八字段契约(人/LLM 在 authoring 期写的设计决策,
  // 生成器只 pass-through 内嵌进 HTML;半个 brief 比没有更糟——会让 QA 在交付末端才爆)
  if (manifest.designBrief != null) {
    for (const e of validateBrief(manifest.designBrief)) {
      errors.push(`designBrief: ${e}`);
    }
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
      if (Array.isArray(slide.evidence)) {
        slide.evidence.forEach((ev, ei) => {
          const p = `${prefix}.evidence[${ei}]`;
          if (!ev || typeof ev !== 'object') { errors.push(`${p} must be an object`); return; }
          if (!ev.id || typeof ev.id !== 'string') errors.push(`${p}.id is required`);
          if (!ev.claimId || typeof ev.claimId !== 'string') errors.push(`${p}.claimId is required`);
          else if (ev.claimId !== slide.id) errors.push(`${p}.claimId must match the owning slide id`);
          if (!['verified', 'user-provided', 'illustrative', 'needs-source'].includes(ev.status)) errors.push(`${p}.status is invalid`);
          if (!ev.label || typeof ev.label !== 'string') errors.push(`${p}.label is required`);
          if (ev.status === 'verified') {
            if (!ev.source || typeof ev.source !== 'object') errors.push(`${p}.source is required for verified evidence (url+locator+checkedAt)`);
            else {
              if (!ev.source.url || !/^https?:\/\//.test(ev.source.url)) errors.push(`${p}.source.url must be an http(s) URL`);
              if (!ev.source.locator || typeof ev.source.locator !== 'string') errors.push(`${p}.source.locator is required`);
              if (!ev.source.checkedAt || !/^\d{4}-\d{2}-\d{2}$/.test(ev.source.checkedAt)) errors.push(`${p}.source.checkedAt must be a YYYY-MM-DD date`);
            }
          }
          if (ev.status === 'user-provided' && (!ev.note || typeof ev.note !== 'string')) errors.push(`${p}.note is required for user-provided evidence`);
          if (ev.status === 'illustrative' && ev.source) errors.push(`${p}.source is forbidden for illustrative evidence`);
        });
      }
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
    designBrief: manifest.designBrief,
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
