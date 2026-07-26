#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RUN_STATES = new Set(['draft', 'rendered', 'needs-visual-signoff', 'ready', 'blocked']);

// validateVisualSignoff — the durable contract for a human visual review that promotes a run to
// `ready`. A bare boolean flag is not auditable evidence; a signoff file must name who reviewed,
// when, which screenshot set (SHA-256 of the screenshots manifest), which deck (SHA-256 of the
// deck file), and a pass decision. When the caller supplies the co-located screenshots manifest
// (opts.manifestFile) or the deck under review (opts.deckFile), the recorded hashes are verified
// against the actual files — a missing file is an error, never a silent skip — so the signoff
// cannot be replayed against a different deck or a different screenshot set.
function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function validateVisualSignoff(signoff, opts = {}) {
  const errors = [];
  if (!signoff || typeof signoff !== 'object' || Array.isArray(signoff)) {
    return ['signoff must be a JSON object'];
  }
  if (!signoff.reviewer || typeof signoff.reviewer !== 'string') {
    errors.push('reviewer is required (e.g. "human:name") — who performed the visual review');
  }
  if (!signoff.reviewedAt || typeof signoff.reviewedAt !== 'string' || Number.isNaN(Date.parse(signoff.reviewedAt))) {
    errors.push('reviewedAt is required (ISO 8601, e.g. 2026-07-24T10:00:00+08:00)');
  }
  if (!signoff.screenshotsManifestSha256 || !/^[0-9a-f]{64}$/.test(signoff.screenshotsManifestSha256)) {
    errors.push('screenshotsManifestSha256 is required (64 hex chars identifying the reviewed screenshots)');
  }
  if (!signoff.deckSha256 || !/^[0-9a-f]{64}$/.test(signoff.deckSha256)) {
    errors.push('deckSha256 is required (64 hex chars binding this signoff to the reviewed deck file)');
  }
  if (signoff.decision !== 'pass') {
    errors.push('decision must be "pass" to promote a run to ready');
  }
  if (opts.manifestFile) {
    if (!fs.existsSync(opts.manifestFile)) {
      errors.push(`screenshots manifest not found: ${opts.manifestFile} (签字必须附截图清单,无法核验的哈希不放行)`);
    } else if (signoff.screenshotsManifestSha256 && /^[0-9a-f]{64}$/.test(signoff.screenshotsManifestSha256)) {
      if (sha256File(opts.manifestFile) !== signoff.screenshotsManifestSha256) {
        errors.push(`screenshotsManifestSha256 does not match ${opts.manifestFile}`);
      }
    }
  }
  if (opts.deckFile) {
    if (!fs.existsSync(opts.deckFile)) {
      errors.push(`deck file not found: ${opts.deckFile}`);
    } else if (signoff.deckSha256 && /^[0-9a-f]{64}$/.test(signoff.deckSha256)) {
      if (sha256File(opts.deckFile) !== signoff.deckSha256) {
        errors.push(`deckSha256 does not match ${opts.deckFile} (签字未绑定该 deck,疑似复用)`);
      }
    }
  }
  return errors;
}
const REQUIRED_FOR_READY = ['manifest-validation', 'render', 'qa-floor', 'pptx-fidelity'];
const VISUAL_STAGES = ['visual-model', 'visual-human-signoff'];

function createRunManifest({ runId, sourceManifest, outputRoot }) {
  return {
    runId,
    sourceManifest,
    outputRoot,
    state: 'draft',
    stages: [],
    updatedAt: new Date().toISOString(),
  };
}

function recordStage(run, stageName, result) {
  const at = new Date().toISOString();
  const existing = run.stages.find((s) => s.name === stageName);
  if (existing) {
    // 防止 stale ok:re-record 时若新 result 未显式声明 ok,清除旧 ok
    // (否则上次成功的 ok 被保留,finalizeRun 误判该 stage 成功)
    if (!('ok' in result)) existing.ok = undefined;
    Object.assign(existing, result, { name: stageName, at });
  } else {
    run.stages.push({ name: stageName, ...result, at });
  }
  run.updatedAt = at;
  return run;
}

function stageOk(run, name) {
  const s = run.stages.find((x) => x.name === name);
  return Boolean(s && s.ok === true);
}

function finalizeRun(run, state) {
  if (!RUN_STATES.has(state)) throw new Error(`invalid run state: ${state}`);
  if (state === 'ready') {
    for (const req of REQUIRED_FOR_READY) {
      if (!stageOk(run, req)) throw new Error(`cannot finalize ready: stage "${req}" not successful`);
    }
    const visualOk = VISUAL_STAGES.some((name) => stageOk(run, name));
    if (!visualOk) throw new Error('cannot finalize ready: no successful visual stage (visual-model or visual-human-signoff)');
  }
  run.state = state;
  run.updatedAt = new Date().toISOString();
  return run;
}

function writeRunManifest(filePath, run) {
  const absolute = path.resolve(filePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  const temporary = `${absolute}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(run, null, 2)}\n`);
  fs.renameSync(temporary, absolute);
}

function buildQaSummary(run) {
  const has = (n) => Boolean(run.stages.find((s) => s.name === n && s.ok === true));
  return {
    version: 1,
    deck: 'run.json',
    state: run.state,
    passed: run.state === 'ready',
    gates: {
      manifestValidation: has('manifest-validation') ? 'pass' : 'fail',
      media: has('media-stage') ? 'pass' : 'fail',
      render: has('render') ? 'pass' : 'fail',
      gradeGate: has('qa-floor') ? 'pass' : 'fail',
      pptxFidelity: has('pptx-fidelity') ? 'pass' : 'fail',
      visual: has('visual-model') ? 'model' : (has('visual-human-signoff') ? 'human-signoff' : 'pending'),
    },
    artifacts: run.stages.filter((s) => s.artifact).map((s) => ({ stage: s.name, path: s.artifact })),
  };
}

module.exports = {
  createRunManifest,
  recordStage,
  finalizeRun,
  writeRunManifest,
  buildQaSummary,
  validateVisualSignoff,
  RUN_STATES,
  REQUIRED_FOR_READY,
  VISUAL_STAGES,
};
