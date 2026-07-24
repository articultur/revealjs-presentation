#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const RUN_STATES = new Set(['draft', 'rendered', 'needs-visual-signoff', 'ready', 'blocked']);
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

module.exports = {
  createRunManifest,
  recordStage,
  finalizeRun,
  writeRunManifest,
  RUN_STATES,
  REQUIRED_FOR_READY,
  VISUAL_STAGES,
};
