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
const { stageManifestMedia } = require('./media-stage');
const {
  createRunManifest,
  recordStage,
  finalizeRun,
  writeRunManifest,
  buildQaSummary,
  validateVisualSignoff,
} = require('./run-manifest');

function assertInRoot(abs, root) {
  const r = path.resolve(root);
  const a = path.resolve(abs);
  if (a !== r && !a.startsWith(r + path.sep)) {
    throw new Error('output path escapes outputRoot (traversal blocked): ' + abs);
  }
}

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

async function main() {
  const a = parseArgs(process.argv.slice(2));
  if (!a.manifest || !a.out) {
    console.error('Usage: node scripts/run-deck-pipeline.js --manifest <file> --out <run-root> [--visual-mode pending|model|signoff]');
    process.exit(2);
  }

  const manifestPath = path.resolve(a.manifest);
  const outRoot = path.resolve(a.out);
  const runId = `run-${Date.now()}`;
  const run = createRunManifest({ runId, sourceManifest: manifestPath, outputRoot: outRoot });
  const writeOut = () => {
    writeRunManifest(path.join(outRoot, 'run.json'), run);
    fs.writeFileSync(path.join(outRoot, 'qa-summary.json'), `${JSON.stringify(buildQaSummary(run), null, 2)}\n`);
  };

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

  // Stage: media staging (local allow-root + remote SSRF guard + SHA256 dedup)
  try {
    manifest = await stageManifestMedia({ manifest, manifestPath, outputDir: outRoot, allowRoot: path.dirname(manifestPath) });
    const mediaCount = manifest.slides.reduce((n, s) => n + (Array.isArray(s.mediaSlots) ? s.mediaSlots.filter((m) => m.sha256).length : 0), 0);
    recordStage(run, 'media-stage', { ok: true, count: mediaCount });
  } catch (e) {
    recordStage(run, 'media-stage', { ok: false, error: e.message });
    finalizeRun(run, 'blocked');
    writeOut();
    process.exit(1);
  }

  // Stage: render (convert manifest → generator input → HTML)
  try {
    const input = manifestToGeneratorInput(manifest);
    const result = generate(input);
    const htmlRel = manifest.output.html;
    const htmlAbs = path.join(outRoot, htmlRel);
    assertInRoot(htmlAbs, outRoot);
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
      recordStage(run, 'visual-model', { ok: false, detail: (vv.stdout || vv.stderr || '').slice(0, 200) });
      finalizeRun(run, 'needs-visual-signoff');
    }
  } else if (visualMode === 'signoff' && a.visualSignoffFile) {
    const src = path.resolve(a.visualSignoffFile);
    let signoffOk = false;
    let signoffErr = '';
    if (!fs.existsSync(src)) {
      signoffErr = `signoff file not found: ${src}`;
    } else {
      try {
        const signoff = JSON.parse(fs.readFileSync(src, 'utf8'));
        const manifestSibling = path.join(path.dirname(src), 'screenshots-manifest.json');
        const errs = validateVisualSignoff(signoff, { manifestFile: manifestSibling, deckFile: htmlAbs });
        if (errs.length) {
          signoffErr = errs.join('; ');
        } else {
          const destDir = path.join(outRoot, 'qa');
          fs.mkdirSync(destDir, { recursive: true });
          fs.copyFileSync(src, path.join(destDir, 'visual-signoff.json'));
          recordStage(run, 'visual-human-signoff', { ok: true, artifact: 'qa/visual-signoff.json' });
          finalizeRun(run, 'ready');
          signoffOk = true;
        }
      } catch (e) {
        signoffErr = `signoff parse error: ${e.message}`;
      }
    }
    if (!signoffOk) {
      recordStage(run, 'visual-human-signoff', { ok: false, error: signoffErr });
      finalizeRun(run, 'needs-visual-signoff');
    }
  } else {
    finalizeRun(run, 'needs-visual-signoff');
  }

  writeOut();
  process.exit(run.state === 'ready' ? 0 : 1);
}

if (require.main === module) main().catch((e) => { console.error(e.stack || e.message); process.exit(2); });

module.exports = { main, parseArgs };
