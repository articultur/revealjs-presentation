#!/usr/bin/env node
'use strict';

/**
 * Off-template generation regression
 * ------------------------------------------------------------
 * Verifies that content outside the seed-template range can still generate
 * a high-quality, single-file Reveal.js deck with export support and hard QA.
 *
 * Usage:
 *   node scripts/test-off-template-regression.js
 *   node scripts/test-off-template-regression.js --no-visual
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const cheerio = require('cheerio');
const { routeDeck } = require('./content-router');

const ROOT = path.resolve(__dirname, '..');
const WITH_VISUAL = !process.argv.includes('--no-visual');
const FIXTURES = [
  {
    name: 'medical-readout',
    file: path.join(ROOT, 'tests/fixtures/off-template-medical.json'),
    minArchetypes: 6,
  },
  {
    name: 'inkwash-style-gap',
    file: path.join(ROOT, 'tests/fixtures/off-template-inkwash.json'),
    minArchetypes: 5,
    requiredVoice: 'chinese-ink-wash',
  },
];

function run(label, args, opts = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: opts.timeout || 240_000,
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });
  return {
    label,
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error,
  };
}

function fail(message, details = '') {
  console.error(`  ✗ ${message}`);
  if (details) console.error(details.trim().split('\n').slice(0, 18).map(line => `    ${line}`).join('\n'));
  process.exitCode = 1;
}

function pass(message) {
  console.log(`  ✓ ${message}`);
}

function parseQualityScore(stdout) {
  const match = stdout.match(/品质总分 qualityScore\s*:\s*(\d+)\/100/);
  return match ? Number(match[1]) : null;
}

function assertRunOk(result) {
  if (result.error) {
    fail(`${result.label} errored`, String(result.error));
    return false;
  }
  if (result.status !== 0) {
    fail(`${result.label} failed with exit ${result.status}`, result.stdout + '\n' + result.stderr);
    return false;
  }
  return true;
}

function assertExportContract(html) {
  const $ = cheerio.load(html);
  const scripts = $('script').map((_, el) => $(el).html() || $(el).attr('src') || '').get().join('\n');
  const hasPptx = /pptxgen\.bundle\.js/i.test(html);
  const hasBootstrap = /function\s+doExport\s*\(/.test(scripts)
    && /document\.createElement\('button'\)/.test(scripts)
    && /btn\.id\s*=\s*'pptx-export-btn'/.test(scripts)
    && /btn\.onclick\s*=\s*doExport/.test(scripts)
    && /DOMContentLoaded/.test(scripts);
  hasPptx && hasBootstrap
    ? pass('inline PPTX export contract present')
    : fail('missing active inline PPTX export contract');
}

function assertEvidenceLabels(html, expectedCount, status) {
  const $ = cheerio.load(html);
  const labels = $('.evidence-label').map((_, el) => $(el).text().trim()).get();
  if (labels.length !== expectedCount) {
    fail(`evidence label count mismatch: ${labels.length} != ${expectedCount}`);
    return;
  }
  labels.every(label => label === status)
    ? pass(`evidence labels present on every slide (${status})`)
    : fail('evidence labels contain unexpected text', labels.join('\n'));
}

console.log('╔══════════════════════════════════════════════╗');
console.log('║  Off-template PPT regression                 ║');
console.log('║  route diversity / grade gate / design score ║');
console.log('╚══════════════════════════════════════════════╝');

for (const fixture of FIXTURES) {
  console.log(`\n[${fixture.name}]`);
  const input = JSON.parse(fs.readFileSync(fixture.file, 'utf8'));
  const routed = routeDeck(input);
  const archetypeCount = routed.deck_check.archetype_count;
  if (archetypeCount >= fixture.minArchetypes) {
    pass(`route diversity ${archetypeCount} archetypes`);
  } else {
    fail(`route diversity too low: ${archetypeCount}`, JSON.stringify(routed.deck_check, null, 2));
  }
  if (routed.deck_check.variant_invented) {
    pass(`theme variants detected (${routed.deck_check.variant_count})`);
  } else {
    fail('no theme variant detected', JSON.stringify(routed.routes, null, 2));
  }

  const out = path.join(os.tmpdir(), `off-template-${fixture.name}.html`);
  const generated = run('generate-archetype-deck', ['scripts/generate-archetype-deck.js', fixture.file, out]);
  if (!assertRunOk(generated)) continue;
  pass(`generated ${out}`);

  const html = fs.readFileSync(out, 'utf8');
  assertExportContract(html);
  assertEvidenceLabels(html, routed.routes.length, input.evidence_status);
  if (fixture.requiredVoice) {
    html.includes(`--c-stamp`) && html.includes('Noto Serif SC')
      ? pass(`style-gap voice token present (${fixture.requiredVoice})`)
      : fail(`missing expected style-gap voice token (${fixture.requiredVoice})`);
  }

  const grade = run('grade-gate', ['scripts/grade-gate.js', out], { timeout: 300_000 });
  assertRunOk(grade) ? pass('grade-gate all green') : null;

  const strength = run('design-strength-check', ['scripts/design-strength-check.js', out]);
  if (assertRunOk(strength)) {
    const score = parseQualityScore(strength.stdout);
    score !== null && score >= 75
      ? pass(`qualityScore ${score} >= 75`)
      : fail(`qualityScore below threshold: ${score}`, strength.stdout);
  }

  if (WITH_VISUAL) {
    const visualOut = path.join(os.tmpdir(), `off-template-${fixture.name}-visual-verdict`);
    const visual = run('visual-verdict dry-run', [
      'scripts/visual-verdict.js',
      out,
      '--dry-run',
      '--slides',
      '1,2',
      '--out',
      visualOut,
    ], { timeout: 300_000 });
    if (assertRunOk(visual)) {
      const promptPath = path.join(visualOut, 'visual-verdict-prompt.md');
      fs.existsSync(promptPath)
        ? pass(`visual dry-run artifact ${promptPath}`)
        : fail('visual dry-run prompt missing', visual.stdout + visual.stderr);
    }
  }
}

console.log('\n[image-proof-routing]');
const imageInput = {
  topic: 'Image proof routing',
  voice: 'editorial-serif',
  sections: [
    { title: 'Cover', body: 'Image proof deck' },
    {
      title: 'Before / after proof',
      img_a: 'https://example.com/a.jpg',
      img_b: 'https://example.com/b.jpg',
      a_label: 'before',
      b_label: 'after',
      a_value: 'Baseline',
      b_value: 'Target',
    },
    { title: '下一步', body: '下一步: publish' },
  ],
};
const imageRoute = routeDeck(imageInput).routes[1];
imageRoute.content_type === 'image-compare' && imageRoute.archetype === 'IMG'
  ? pass('img_a/img_b auto-routes to IMG archetype')
  : fail('img_a/img_b did not auto-route to IMG', JSON.stringify(imageRoute, null, 2));

console.log('\n[image-field-contract]');
const badImageFixture = path.join(os.tmpdir(), 'off-template-bad-image.json');
fs.writeFileSync(badImageFixture, JSON.stringify({
  topic: 'Bad image proof contract',
  voice: 'editorial-serif',
  sections: [
    { title: 'Cover', content_type: 'cover', body: 'Bad image proof' },
    { title: 'Broken image proof', content_type: 'image-compare', img_a: 'https://example.com/a.jpg', a_label: 'before', b_label: 'after' },
  ],
}, null, 2));
const badImage = run('generate-archetype-deck bad image', ['scripts/generate-archetype-deck.js', badImageFixture, path.join(os.tmpdir(), 'off-template-bad-image.html')]);
if (badImage.status !== 0 && /Missing image-compare fields: img_b/.test(badImage.stderr + badImage.stdout)) {
  pass('image-compare missing fields fail explicitly');
} else {
  fail('image-compare missing fields did not fail explicitly', badImage.stdout + badImage.stderr);
}

console.log('\n[style-gap-contract]');
const missingGapFixture = path.join(os.tmpdir(), 'off-template-missing-style-gap.json');
fs.writeFileSync(missingGapFixture, JSON.stringify({
  topic: 'Missing style gap contract',
  voice: 'editorial-serif',
  off_template: true,
  sections: [
    { title: 'Cover', content_type: 'cover', body: 'Off-template without contract' },
    { title: '核心结论', content_type: 'thesis', body: '核心结论:必须先声明四件套。' },
  ],
}, null, 2));
const missingGap = run('generate-archetype-deck missing style gap', ['scripts/generate-archetype-deck.js', missingGapFixture, path.join(os.tmpdir(), 'off-template-missing-style-gap.html')]);
if (missingGap.status !== 0 && /Missing style-gap contract fields: inspiration_case, token, content_rewrite, layout_variant/.test(missingGap.stderr + missingGap.stdout)) {
  pass('off-template deck requires style-gap four-piece contract');
} else {
  fail('off-template style-gap contract did not fail explicitly', missingGap.stdout + missingGap.stderr);
}

console.log('\n[implicit-fallback-contract]');
const fallbackFixture = path.join(os.tmpdir(), 'off-template-implicit-fallback.json');
fs.writeFileSync(fallbackFixture, JSON.stringify({
  topic: 'Implicit fallback contract',
  voice: 'editorial-serif',
  off_template: true,
  style_gap: {
    inspiration_case: 'test case',
    token: 'editorial-serif',
    content_rewrite: 'test rewrite',
    layout_variant: 'test variant',
  },
  sections: [
    { title: 'Cover', content_type: 'cover', body: 'Off-template route fallback test' },
    { title: 'Unclassified middle', body: 'Plain text with no detectable structure should not silently become chapter.' },
    { title: '下一步', content_type: 'closing', body: '下一步: classify the middle slide.' },
  ],
}, null, 2));
const fallback = run('generate-archetype-deck implicit fallback', ['scripts/generate-archetype-deck.js', fallbackFixture, path.join(os.tmpdir(), 'off-template-implicit-fallback.html')]);
if (fallback.status !== 0 && /Deck route cannot use implicit chapter fallback: section 1/.test(fallback.stderr + fallback.stdout)) {
  pass('implicit chapter fallback fails explicitly');
} else {
  fail('implicit chapter fallback did not fail explicitly', fallback.stdout + fallback.stderr);
}

console.log('\n[style-gap-token-contract]');
const tokenMismatchFixture = path.join(os.tmpdir(), 'off-template-token-mismatch.json');
fs.writeFileSync(tokenMismatchFixture, JSON.stringify({
  topic: 'Token mismatch contract',
  voice: 'editorial-serif',
  off_template: true,
  style_gap: {
    inspiration_case: 'test case',
    token: 'chinese-ink-wash',
    content_rewrite: 'test rewrite',
    layout_variant: 'test variant',
  },
  sections: [
    { title: 'Cover', content_type: 'cover', body: 'Off-template token mismatch test' },
    { title: '核心结论', content_type: 'thesis', body: '核心结论:token 必须和 voice 一致。' },
  ],
}, null, 2));
const tokenMismatch = run('generate-archetype-deck token mismatch', ['scripts/generate-archetype-deck.js', tokenMismatchFixture, path.join(os.tmpdir(), 'off-template-token-mismatch.html')]);
if (tokenMismatch.status !== 0 && /Style-gap token must match voice: chinese-ink-wash != editorial-serif/.test(tokenMismatch.stderr + tokenMismatch.stdout)) {
  pass('style-gap token must match voice');
} else {
  fail('style-gap token mismatch did not fail explicitly', tokenMismatch.stdout + tokenMismatch.stderr);
}

console.log('\n[missing-token-contract]');
const badFixture = path.join(os.tmpdir(), 'off-template-missing-token.json');
fs.writeFileSync(badFixture, JSON.stringify({
  topic: 'Missing token contract',
  voice: 'missing-style-token',
  sections: [{ title: 'Missing token', body: 'This should fail explicitly.' }],
}, null, 2));
const badOut = path.join(os.tmpdir(), 'off-template-missing-token.html');
const bad = run('generate-archetype-deck missing token', ['scripts/generate-archetype-deck.js', badFixture, badOut]);
if (bad.status !== 0 && /Missing style token primitive: tokens\/missing-style-token\.css/.test(bad.stderr + bad.stdout)) {
  pass('missing voice token fails explicitly');
} else {
  fail('missing voice token did not fail explicitly', bad.stdout + bad.stderr);
}

console.log('\n[missing-font-contract]');
const missingFontFixture = path.join(os.tmpdir(), 'off-template-missing-font.json');
fs.writeFileSync(missingFontFixture, JSON.stringify({
  topic: 'Missing font contract',
  voice: 'base',
  sections: [{ title: 'Missing font map', body: 'Token exists, font mapping should fail explicitly.' }],
}, null, 2));
const missingFont = run('generate-archetype-deck missing font', ['scripts/generate-archetype-deck.js', missingFontFixture, path.join(os.tmpdir(), 'off-template-missing-font.html')]);
if (missingFont.status !== 0 && /Missing voice font mapping: base/.test(missingFont.stderr + missingFont.stdout)) {
  pass('missing voice font mapping fails explicitly');
} else {
  fail('missing voice font mapping did not fail explicitly', missingFont.stdout + missingFont.stderr);
}

if (process.exitCode) {
  console.log('\nOff-template regression: FAIL');
  process.exit(process.exitCode);
}

console.log('\nOff-template regression: PASS');
