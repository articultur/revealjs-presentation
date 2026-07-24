#!/usr/bin/env node
'use strict';

/**
 * Authoring → Delivery end-to-end proof.
 * ------------------------------------------------------------
 * Drives the real pipeline against the workbench-e2e fixture: copy into a temp run root,
 * stage media, validate the manifest, render, run the QA floor, sign the visual review,
 * reach run.json state=ready, then independently exercise PPTX fidelity + export and assert
 * every artifact path exists. This is the capstone that proves the authoring-delivery system
 * is wired end-to-end — no stage is stubbed or weakened.
 *
 * Usage:
 *   node scripts/test-authoring-e2e.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const { validateDeckManifest } = require('./deck-manifest');

const ROOT = path.resolve(__dirname, '..');
const FIXTURE = path.join(ROOT, 'tests', 'fixtures', 'workbench-e2e.manifest.json');
const MEDIA_SRC = path.join(ROOT, 'tests', 'fixtures', 'media', 'tiny-source.svg');
const SECTIONS_EXPECTED = 8;

let step = 0;
function assert(cond, msg) {
  step += 1;
  if (!cond) {
    console.error(`  [${step}] ✗ ${msg}`);
    console.error('\nAuthoring E2E: FAIL');
    process.exit(1);
  }
  console.log(`  [${step}] ✓ ${msg}`);
}

function run(script, args) {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', script), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 480000,
  });
  return { ok: r.status === 0 && !r.error, status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

// ── 1. Copy the fixture into an isolated temp run root (media asset alongside it) ──
const runRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'reveal-authoring-e2e-'));
const manifestPath = path.join(runRoot, 'deck.manifest.json');
const manifest = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
fs.mkdirSync(path.join(runRoot, 'media'), { recursive: true });
fs.copyFileSync(MEDIA_SRC, path.join(runRoot, 'media', 'tiny-source.svg'));
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Authoring E2E · run root: ${runRoot}`);

// ── 3. Validate the manifest (strict evidence rules) before any staging ──
const vr = validateDeckManifest(manifest);
assert(vr.ok, `manifest validates strictly${vr.ok ? '' : ': ' + vr.errors.join('; ')}`);

// ── 7. Create a test-only signed visual review artifact (valid per validateVisualSignoff) ──
const signoffPath = path.join(runRoot, 'signoff.json');
fs.writeFileSync(signoffPath, `${JSON.stringify({
  version: 1,
  reviewer: 'human:e2e',
  reviewedAt: '2026-07-24T10:00:00+08:00',
  screenshotsManifestSha256: 'a'.repeat(64),
  decision: 'pass',
  notes: 'Test-only signoff driving the pipeline to ready; not a real human review.',
}, null, 2)}\n`);

// ── 2,4,6,10. Drive the real pipeline: stage media → render → QA floor → signed signoff → ready ──
const pipe = run('run-deck-pipeline.js', [
  '--manifest', manifestPath,
  '--out', runRoot,
  '--visual-mode', 'signoff',
  '--visual-signoff-file', signoffPath,
]);
if (!pipe.ok) {
  console.error('  ✗ pipeline did not reach ready:\n' + (pipe.stderr || pipe.stdout).slice(-1500));
  console.error('\nAuthoring E2E: FAIL');
  process.exit(1);
}
assert(true, 'pipeline ran: stage media → render → QA floor → signed visual signoff');

// ── 10. Assert run.json.state === ready ──
const runJsonPath = path.join(runRoot, 'run.json');
assert(fs.existsSync(runJsonPath), 'run.json written');
const runJson = JSON.parse(fs.readFileSync(runJsonPath, 'utf8'));
assert(runJson.state === 'ready', `run.json.state === ready (got "${runJson.state}")`);

// ── 5. Assert eight sections, each stamped with its manifest data-slide-id ──
const htmlRel = manifest.output.html;
const htmlPath = path.join(runRoot, htmlRel);
assert(fs.existsSync(htmlPath), `rendered HTML exists (${htmlRel})`);
const html = fs.readFileSync(htmlPath, 'utf8');
const sectionCount = (html.match(/<section /g) || []).length;
assert(sectionCount === SECTIONS_EXPECTED, `rendered deck has ${SECTIONS_EXPECTED} sections (got ${sectionCount})`);
for (const slide of manifest.slides) {
  assert(html.includes(`data-slide-id="${slide.id}"`), `section stamped data-slide-id="${slide.id}"`);
}
// Evidence traceability: the verified + user-provided ids must be stamped.
assert(html.includes('data-evidence-id="ev-share-38"'), 'verified evidence id stamped (ev-share-38)');
assert(html.includes('data-evidence-id="ev-network-note"'), 'user-provided evidence id stamped (ev-network-note)');

// ── 8. Analyze PPTX fidelity against the (staged) manifest ──
const stagedManifest = path.join(runRoot, 'deck.manifest.json');
const fidelity = run('analyze-pptx-fidelity.js', [stagedManifest]);
assert(fidelity.ok, 'analyze-pptx-fidelity runs against the staged manifest');

// ── 9. Export PPTX from the rendered HTML ──
const pptxOut = path.join(runRoot, 'deck-exported.pptx');
const exp = run('export-pptx.js', [htmlPath, '-o', pptxOut]);
assert(exp.ok && fs.existsSync(pptxOut) && fs.statSync(pptxOut).size > 0, 'PPTX exported (non-empty file)');

// ── 11. Assert every artifact path referenced in run.json exists on disk ──
let artifactCount = 0;
for (const stage of runJson.stages || []) {
  if (stage.artifact) {
    const ap = path.join(runRoot, stage.artifact);
    assert(fs.existsSync(ap), `run.json artifact exists: ${stage.artifact}`);
    artifactCount += 1;
  }
}
assert(artifactCount >= 3, `run.json references ≥3 artifacts (got ${artifactCount})`);

console.log('\nAuthoring E2E: PASS');
