#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const root = path.resolve(__dirname, '..');
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function requireToken(content, token, label) {
  if (token instanceof RegExp) {
    if (!token.test(content)) fail(`${label} is missing pattern ${token}`);
    return;
  }
  if (!content.includes(token)) fail(`${label} is missing "${token}"`);
}

const skill = read('SKILL.md');
requireToken(skill, 'references/launch-grade.md', 'SKILL.md');
requireToken(skill, '发布会级模式', 'SKILL.md');
requireToken(skill, 'node scripts/test-launch-grade-contract.js', 'SKILL.md');
requireToken(skill, 'visual-verdict.js', 'SKILL.md');

if (!exists('references/launch-grade.md')) {
  fail('references/launch-grade.md is missing.');
} else {
  const launch = read('references/launch-grade.md');
  [
    'tests/fixtures/launch-grade-principles.html',
    'Golden Reference',
    'Page Archetypes',
    'Visual QA Loop',
    'Scoring Rubric',
    'Failure Gates',
    'PPTX',
    'visual-qa.js',
    'visual-verdict.js',
    'validate.js',
    'lint-design.js',
    'deck-grid',
    'deck-flex',
  ].forEach((token) => requireToken(launch, token, 'references/launch-grade.md'));
}

function archetypeCoverage(deck) {
  const $ = cheerio.load(deck);
  const sectionChunks = $('section').toArray().map((section) => {
    const el = $(section);
    const childHtml = el.clone().children('section').remove().end().html() || '';
    return {
      explicit: el.attr('data-archetype') || '',
      classOnly: el.attr('class') || '',
      content: childHtml,
    };
  });
  const explicitMap = new Map([
    ['brand-opener', 'brand opener'],
    ['statement-wall', 'statement wall'],
    ['key-metrics', 'key metrics'],
    ['interaction-proof', 'interaction proof'],
    ['ecosystem-map', 'ecosystem map'],
    ['engine-proof', 'engine or split proof'],
    ['commercial', 'commercial chapter'],
    ['finale', 'finale'],
  ]);
  const classPatterns = [
    ['brand opener', /\b(?:hero|brand-opener)\b/i],
    ['statement wall', /\b(?:statement-wall|manifesto|big-word)\b/i],
    ['key metrics', /\b(?:metrics|key-metrics)\b/i],
    ['interaction proof', /\b(?:danmaku|interaction-proof)\b/i],
    ['ecosystem map', /\b(?:ecosystem|community-map|ecosystem-map)\b/i],
    ['engine or split proof', /\b(?:engine|two-col|split|engine-proof)\b/i],
    ['commercial chapter', /\b(?:commercial|revenue)\b/i],
    ['finale', /\bfinale\b/i],
  ];
  const contentPatterns = [
    ['brand opener', /哔哩|bilibili|public launch|Nova Stage/i],
    ['statement wall', /现场画面|为热爱/i],
    ['key metrics', /Key metrics|active users|月活|日活|[\d.]+\s*(?:亿|万|M|%)/i],
    ['interaction proof', /comment stream|弹幕|评论|Live comment/i],
    ['ecosystem map', /Platform|Creator|Community/i],
    ['engine or split proof', /引擎|商业/i],
    ['commercial chapter', /revenue|变现/i],
    ['finale', /结束|Launch with proof/i],
  ];

  const found = new Set();
  for (const section of sectionChunks) {
    const explicit = section.explicit;
    if (explicit && explicitMap.has(explicit)) {
      found.add(explicitMap.get(explicit));
      continue;
    }

    const classMatch = classPatterns.find(([, pattern]) => pattern.test(section.classOnly));
    if (classMatch) {
      found.add(classMatch[0]);
      continue;
    }

    const contentMatch = contentPatterns.find(([, pattern]) => pattern.test(section.content));
    if (contentMatch) {
      found.add(contentMatch[0]);
    }
  }

  return [...found];
}

function checkLaunchReference(relativePath, options = {}) {
  if (!exists(relativePath)) {
    fail(`${relativePath} launch-grade reference is missing.`);
    return;
  }

  const deck = read(relativePath);
  const sectionCount = cheerio.load(deck)('section').length;
  if (sectionCount < (options.minSections || 6)) {
    fail(`${relativePath} should keep at least ${options.minSections || 6} sections; found ${sectionCount}.`);
  }

  [
    /\.reveal \.slides > section\.deck-grid\.present/,
    /\.reveal \.slides > section\.deck-flex\.present/,
    /<section class="[^"]*\bdeck-(?:grid|flex)\b/,
    /--c-accent/,
  ].forEach((pattern) => requireToken(deck, pattern, relativePath));

  const archetypes = archetypeCoverage(deck);
  if (archetypes.length < (options.minArchetypes || 4)) {
    fail(`${relativePath} should cover at least ${options.minArchetypes || 4} launch-grade archetypes; found ${archetypes.join(', ') || 'none'}.`);
  }

  if (/letter-spacing\s*:\s*-\d/.test(deck)) {
    fail(`${relativePath} must not use negative letter-spacing.`);
  }
  if (/(?:font-size|width|height|gap|padding|margin)\s*:\s*[\d.]+v[wh]/.test(deck)) {
    fail(`${relativePath} must not use vw/vh for core sizing.`);
  }
}

const commerceInEcosystemOnly = `
<section class="deck-grid ecosystem-map" data-archetype="ecosystem-map">
  <div>Creator</div><div>Community</div><div>Commerce</div><div>Platform</div>
</section>`;
const negativeCoverage = archetypeCoverage(commerceInEcosystemOnly);
if (negativeCoverage.includes('commercial chapter')) {
  fail('archetype coverage must not count Commerce inside an ecosystem section as a commercial chapter.');
}

const nestedRevealSections = `
<section>
  <section class="deck-grid statement-wall" data-archetype="statement-wall"><h2>nested statement</h2></section>
  <section class="deck-grid key-metrics" data-archetype="key-metrics"><b>4.8M</b></section>
</section>`;
const nestedCoverage = archetypeCoverage(nestedRevealSections);
if (!nestedCoverage.includes('statement wall') || !nestedCoverage.includes('key metrics')) {
  fail('archetype coverage must traverse nested Reveal.js sections.');
}

checkLaunchReference('tests/fixtures/launch-grade-principles.html', { minSections: 6, minArchetypes: 5 });

const pkg = JSON.parse(read('package.json'));
if (pkg.scripts?.['test:launch-grade-contract'] !== 'node scripts/test-launch-grade-contract.js') {
  fail('package.json must expose test:launch-grade-contract.');
}

if (failures.length) {
  console.error('Launch-grade contract failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Launch-grade contract passed.');
