#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const {
  loadDeckManifest,
  validateDeckManifest,
  manifestToGeneratorInput,
} = require('./deck-manifest');
const { generate } = require('./generate-deck');
const {
  createRunManifest,
  recordStage,
  finalizeRun,
  writeRunManifest,
} = require('./run-manifest');

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--manifest') a.manifest = argv[++i];
    else if (k === '--out') a.out = argv[++i];
    else if (k === '--visual-mode') a.visualMode = argv[++i];
    else if (k === '--visual-signoff-file') a.visualSignoffFile = argv[++i];
    else { console.error(`unknown flag: ${k}`); process.exit(2); }
  }
  return a;
}

function runNode(script, args, timeout = 420000) {
  const r = spawnSync('node', [path.join(__dirname, script), ...args], {
    encoding: 'utf8',
    timeout,
  });
  return {
    ok: r.status === 0,
    stdout: (r.stdout || '').trim(),
    stderr: (r.stderr || (r.error && r.error.message) || '').trim(),
  };
}

function main() {
  const a = parseArgs(process.argv.slice(2));
  if (!a.manifest || !a.out) {
    console.error('Usage: node scripts/run-deck-pipeline.js --manifest <file> --out <run-root> [--visual-mode pending|model|signoff]');
    process.exit(2);
  }

  const manifestPath = path.resolve(a.manifest);
  const outRoot = path.resolve(a.out);
  const runId = `run-${Date.now()}`;
  const run = createRunManifest({ runId, sourceManifest: manifestPath, outputRoot: outRoot });
  const writeOut = () => writeRunManifest(path.join(outRoot, 'run.json'), run);

  // Stage 1: manifest validation (fail-closed)
  let manifest;
  try {
    manifest = loadDeckManifest(manifestPath);
    const v = validateDeckManifest(manifest);
    if (!v.ok) throw new Error(v.errors.join('\n'));
    recordStage(run, 'manifest-validation', { ok: true, artifact: 'deck.manifest.json' });
  } catch (e) {
    recordStage(run, 'manifest-validation', { ok: false, error: e.message });
    finalizeRun(run, 'blocked');
    writeOut();
    process.exit(1);
  }

  // Stage: media (Task 5 inserts staging here; empty set is a successful no-op for now)
  recordStage(run, 'media-stage', { ok: true, count: 0 });

  // Stage: render (convert manifest → generator input → HTML)
  try {
    const input = manifestToGeneratorInput(manifest);
    const result = generate(input);
    const htmlRel = manifest.output.html;
    const htmlAbs = path.join(outRoot, htmlRel);
    fs.mkdirSync(path.dirname(htmlAbs), { recursive: true });
    fs.writeFileSync(htmlAbs, result.html);
    recordStage(run, 'render', { ok: true, artifact: htmlRel });
  } catch (e) {
    recordStage(run, 'render', { ok: false, error: e.message });
    finalizeRun(run, 'blocked');
    writeOut();
    process.exit(1);
  }

  const htmlAbs = path.join(outRoot, manifest.output.html);

  // Stage: QA floor (no visual)
  const qa = runNode('qa.js', [htmlAbs, '--no-visual']);
  recordStage(run, 'qa-floor', {
    ok: qa.ok,
    detail: qa.ok ? 'grade-gate + design-strength + element-quality + editorial pass' : (qa.stdout || qa.stderr).split('\n').slice(0, 4).join('\n'),
  });
  if (!qa.ok) {
    finalizeRun(run, 'blocked');
    writeOut();
    process.exit(1);
  }

  // Stage: PPTX fidelity (Task 8 fills this in; placeholder success so the pipeline can be exercised)
  recordStage(run, 'pptx-fidelity', { ok: true, note: 'placeholder — Task 8 wires analyze-pptx-fidelity.js' });

  // Stage: visual review — fail-closed to needs-visual-signoff unless explicit model or signed human evidence
  const visualMode = a.visualMode || 'pending';
  if (visualMode === 'model') {
    const vv = runNode('qa.js', [htmlAbs, '--visual']);
    if (vv.ok) {
      recordStage(run, 'visual-model', { ok: true, artifact: 'qa/visual-verdict.json' });
      finalizeRun(run, 'ready');
    } else {
      finalizeRun(run, 'needs-visual-signoff');
    }
  } else if (visualMode === 'signoff' && a.visualSignoffFile) {
    const src = path.resolve(a.visualSignoffFile);
    if (!fs.existsSync(src)) {
      finalizeRun(run, 'needs-visual-signoff');
    } else {
      const destDir = path.join(outRoot, 'qa');
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(src, path.join(destDir, 'visual-signoff.json'));
      recordStage(run, 'visual-human-signoff', { ok: true, artifact: 'qa/visual-signoff.json' });
      finalizeRun(run, 'ready');
    }
  } else {
    finalizeRun(run, 'needs-visual-signoff');
  }

  writeOut();
  process.exit(run.state === 'ready' ? 0 : 1);
}

if (require.main === module) main();

module.exports = { main, parseArgs };
