#!/usr/bin/env node
'use strict';

const {
  createRunManifest,
  recordStage,
  finalizeRun,
  buildQaSummary,
} = require('./run-manifest');

// Step 1: normal transition to needs-visual-signoff
const run = createRunManifest({
  runId: 'run-test-001',
  sourceManifest: 'tests/fixtures/deck-manifest-valid.json',
  outputRoot: '/tmp/reveal-run-test',
});
recordStage(run, 'manifest-validation', { ok: true, artifact: 'deck.manifest.json' });
recordStage(run, 'render', { ok: true, artifact: 'ppt/index.html' });
finalizeRun(run, 'needs-visual-signoff');

if (run.state !== 'needs-visual-signoff') {
  console.error(`state should be needs-visual-signoff, got ${run.state}`);
  process.exit(1);
}
if (run.stages.length !== 2) {
  console.error(`stages should be 2, got ${run.stages.length}`);
  process.exit(1);
}
if (!run.updatedAt) {
  console.error('updatedAt must be set');
  process.exit(1);
}

// Step 2: finalizeRun('ready') throws when manifest validation failed
let threw = false;
try {
  const failed = createRunManifest({
    runId: 'run-test-002',
    sourceManifest: 'x',
    outputRoot: '/tmp/reveal-run-test',
  });
  recordStage(failed, 'manifest-validation', { ok: false, error: 'invalid' });
  finalizeRun(failed, 'ready');
} catch (e) {
  threw = true;
}
if (!threw) {
  console.error('finalizeRun(ready) must throw when a required stage failed');
  process.exit(1);
}

// Step 3: finalizeRun('ready') throws when visual stage missing even if others ok
let threwVisual = false;
try {
  const noVisual = createRunManifest({
    runId: 'run-test-003',
    sourceManifest: 'x',
    outputRoot: '/tmp/reveal-run-test',
  });
  recordStage(noVisual, 'manifest-validation', { ok: true });
  recordStage(noVisual, 'render', { ok: true });
  recordStage(noVisual, 'qa-floor', { ok: true });
  recordStage(noVisual, 'pptx-fidelity', { ok: true });
  finalizeRun(noVisual, 'ready');
} catch (e) {
  threwVisual = true;
}
if (!threwVisual) {
  console.error('finalizeRun(ready) must throw when no visual stage is successful');
  process.exit(1);
}

// Step 4: finalizeRun('ready') succeeds when all required + visual present
const ready = createRunManifest({
  runId: 'run-test-004',
  sourceManifest: 'x',
  outputRoot: '/tmp/reveal-run-test',
});
recordStage(ready, 'manifest-validation', { ok: true });
recordStage(ready, 'render', { ok: true });
recordStage(ready, 'qa-floor', { ok: true });
recordStage(ready, 'pptx-fidelity', { ok: true });
recordStage(ready, 'visual-human-signoff', { ok: true, artifact: 'qa/visual-signoff.json' });
finalizeRun(ready, 'ready');
if (ready.state !== 'ready') {
  console.error(`state should be ready, got ${ready.state}`);
  process.exit(1);
}

// Step 5: qa-summary is derived from the run state — ready runs must report a visual gate
const summary = buildQaSummary(ready);
if (summary.state !== 'ready' || !summary.passed) {
  console.error('qa-summary must report ready/passed for a ready run');
  process.exit(1);
}
if (summary.gates.visual !== 'human-signoff') {
  console.error(`qa-summary visual gate should be human-signoff, got ${summary.gates.visual}`);
  process.exit(1);
}
const pendingSummary = buildQaSummary(run);
if (pendingSummary.passed || pendingSummary.gates.visual !== 'pending') {
  console.error('needs-visual-signoff run must not pass and must show pending visual gate');
  process.exit(1);
}

console.log('Run pipeline contract: PASS');
