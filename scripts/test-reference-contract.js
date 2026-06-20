#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');

const referenceFiles = [
  'references/data-viz.md',
  'references/diagram-system.md',
  'references/image-system.md',
  'references/icon-system.md',
  'references/layout-patterns.md',
  'references/design-polish.md',
  'references/launch-grade.md',
  'references/template-differentiation-audit.md',
];

const staleTokenRe = /var\(--(?:accent|accent-light|accent-dark|bg|bg-subtle|text|text-muted|text-subtle)\)/g;

const failures = [];

function fail(message) {
  failures.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function lineFor(content, index) {
  return content.slice(0, index).split('\n').length;
}

for (const file of referenceFiles) {
  const content = read(file);
  let match;
  while ((match = staleTokenRe.exec(content)) !== null) {
    fail(`${file}:${lineFor(content, match.index)} uses stale token ${match[0]}; use --c-* tokens in reference snippets`);
  }
}

const dataViz = read('references/data-viz.md');
if (!/数据来源|Source/i.test(dataViz)) {
  fail('references/data-viz.md must require a visible data source label for every real data visualization.');
}
if (!/禁止捏造|不得捏造|不要捏造|must not invent/i.test(dataViz)) {
  fail('references/data-viz.md must explicitly forbid invented data unless it is marked illustrative.');
}

const diagramSystem = read('references/diagram-system.md');
if (!/Mermaid/i.test(diagramSystem) || !/不要|避免|不得|禁止|not/i.test(diagramSystem)) {
  fail('references/diagram-system.md must explicitly steer public decks away from Mermaid-style default diagrams.');
}
if (/class="diagram-node"[^>]*style="[^"]*position\s*:\s*absolute/i.test(diagramSystem)) {
  fail('references/diagram-system.md must not show position:absolute on diagram nodes; use grid/flex nodes and absolute SVG connector layers only.');
}

const launchGrade = read('references/launch-grade.md');
[
  ['golden reference', /launch-grade-principles\.html/],
  ['page archetypes', /Page Archetypes/],
  ['scoring rubric', /Scoring Rubric/],
  ['visual QA command', /visual-qa\.js/],
  ['PPTX export proof', /PPTX/],
].forEach(([label, pattern]) => {
  if (!pattern.test(launchGrade)) {
    fail(`references/launch-grade.md is missing ${label}.`);
  }
});

const skill = read('SKILL.md');
[
  ['native grammar gate', /原生语法|Native Grammar/i],
  ['evidence ledger gate', /证据台账|Evidence Ledger/i],
  ['overflow blocker language', /total\s*>\s*0[\s\S]{0,120}(阻断|blocker|必须修复)/i],
  ['fragment initial-state gate', /fragment[\s\S]{0,120}(初始|首屏|隐藏)/i],
].forEach(([label, pattern]) => {
  if (!pattern.test(skill)) {
    fail(`SKILL.md is missing ${label}.`);
  }
});

const expectedTemplates = [
  'examples/template-01-editorial-serif.html',
  'examples/template-02-dark-tech.html',
  'examples/template-03-minimal-spatial.html',
  'examples/template-04-vibrant-gradient.html',
  'examples/template-05-nature-fresh.html',
  'examples/template-06-brutalist.html',
  'examples/template-07-memphis.html',
  'examples/template-08-isometric.html',
];

const genericMarkerRe = /^(?:hero|card|panel|section|content|block|item|box)$/i;

function classAttrs(content) {
  return Array.from(content.matchAll(/class="([^"]*)"/g), match => match[1]);
}

function classMarkerExists(content, marker) {
  const required = String(marker).trim().split(/\s+/).filter(Boolean);
  if (!required.length) return false;
  return classAttrs(content).some(attr => {
    const tokens = new Set(attr.split(/\s+/).filter(Boolean));
    return required.every(token => tokens.has(token));
  });
}

function extractSectionByClass(content, marker) {
  const re = /<section\b[^>]*class="([^"]*)"[\s\S]*?<\/section>/gi;
  let match;
  while ((match = re.exec(content)) !== null) {
    const tokens = new Set(match[1].split(/\s+/).filter(Boolean));
    if (tokens.has(marker)) return match[0];
  }
  return '';
}

function cssClassSelectorExists(content, marker) {
  const selector = String(marker).trim().split(/\s+/).filter(Boolean)
    .map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('\\.');
  if (!selector) return false;
  return new RegExp(`\\.${selector}(?![\\w-])`).test(content);
}

function selectorClassTokens(selector) {
  return Array.from(String(selector || '').matchAll(/\.([A-Za-z_][\w-]*)/g), m => m[1]);
}

function selectorAnchorsExist(content, selector) {
  const classTokens = selectorClassTokens(selector);
  if (!classTokens.length) return true;
  return classTokens.every(token => classMarkerExists(content, token) || cssClassSelectorExists(content, token));
}

function assertSelector(templatePath, template, selector, context) {
  if (!selector || typeof selector !== 'string') {
    fail(`${templatePath} physicalContract ${context} must define a CSS selector.`);
  } else if (!selectorAnchorsExist(template, selector)) {
    fail(`${templatePath} physicalContract ${context} selector "${selector}" references class(es) not found in the template.`);
  }
}

function assertPhysicalContract(templatePath, template, invariant) {
  const contract = invariant.physicalContract;
  if (templatePath === 'examples/template-03-minimal-spatial.html' && !contract) {
    fail(`${templatePath} must declare a physicalContract for the architectural drawing sheet.`);
    return;
  }
  if (!contract) return;
  if (contract.version !== 1 || !contract.purpose) {
    fail(`${templatePath} physicalContract must define version=1 and purpose.`);
  }

  const surfaceRules = contract.surfaceRules || [];
  if (!Array.isArray(surfaceRules) || surfaceRules.length === 0) {
    fail(`${templatePath} physicalContract must define at least one surfaceRules entry.`);
  }
  for (const rule of surfaceRules) {
    if (!rule.name) fail(`${templatePath} physicalContract surface rule is missing name.`);
    assertSelector(templatePath, template, rule.surface, `surfaceRules.${rule.name || '?'}.surface`);
    if (!Array.isArray(rule.contents) || rule.contents.length === 0) {
      fail(`${templatePath} physicalContract surface rule "${rule.name || '?'}" must list contents.`);
    } else {
      for (const selector of rule.contents) {
        assertSelector(templatePath, template, selector, `surfaceRules.${rule.name || '?'}.contents`);
      }
    }
  }

  for (const rule of contract.exclusionRules || []) {
    if (!rule.name) fail(`${templatePath} physicalContract exclusion rule is missing name.`);
    assertSelector(templatePath, template, rule.a, `exclusionRules.${rule.name || '?'}.a`);
    assertSelector(templatePath, template, rule.b, `exclusionRules.${rule.name || '?'}.b`);
  }

  for (const rule of contract.alignmentRules || []) {
    if (!rule.name) fail(`${templatePath} physicalContract alignment rule is missing name.`);
    if (!['horizontalEdges'].includes(rule.type)) {
      fail(`${templatePath} physicalContract alignment rule "${rule.name || '?'}" uses unsupported type "${rule.type}".`);
    }
    assertSelector(templatePath, template, rule.subject, `alignmentRules.${rule.name || '?'}.subject`);
    assertSelector(templatePath, template, rule.target, `alignmentRules.${rule.name || '?'}.target`);
  }

  for (const rule of contract.placementRules || []) {
    if (!rule.name) fail(`${templatePath} physicalContract placement rule is missing name.`);
    assertSelector(templatePath, template, rule.subject, `placementRules.${rule.name || '?'}.subject`);
    assertSelector(templatePath, template, rule.container, `placementRules.${rule.name || '?'}.container`);
  }

  for (const rule of contract.collisionRules || []) {
    if (!rule.name) fail(`${templatePath} physicalContract collision rule is missing name.`);
    assertSelector(templatePath, template, rule.scope, `collisionRules.${rule.name || '?'}.scope`);
    assertSelector(templatePath, template, rule.a, `collisionRules.${rule.name || '?'}.a`);
    assertSelector(templatePath, template, rule.b, `collisionRules.${rule.name || '?'}.b`);
    if (!rule.bTextPattern) {
      fail(`${templatePath} physicalContract collision rule "${rule.name || '?'}" must define bTextPattern to avoid broad decorative collisions.`);
    }
  }
}

function readTemplateInvariants() {
  const manifestPath = 'references/template-invariants.json';
  let parsed;
  try {
    parsed = JSON.parse(read(manifestPath));
  } catch (err) {
    fail(`${manifestPath} must be valid JSON: ${err.message}`);
    return { templates: {} };
  }
  if (!parsed || parsed.version !== 1 || !parsed.templates || typeof parsed.templates !== 'object') {
    fail(`${manifestPath} must define version=1 and a templates object.`);
    return { templates: {} };
  }
  return parsed;
}

const templateInvariants = readTemplateInvariants();
const invariantTemplatePaths = Object.keys(templateInvariants.templates).sort();
if (JSON.stringify(invariantTemplatePaths) !== JSON.stringify([...expectedTemplates].sort())) {
  fail('references/template-invariants.json must list exactly the 8 expected seed templates.');
}

const coverClassOwners = new Map();

for (const templatePath of expectedTemplates) {
  const templateAbs = path.join(root, templatePath);
  if (!fs.existsSync(templateAbs)) {
    fail(`${templatePath} is listed as a seed template but the file is missing.`);
    continue;
  }

  const template = read(templatePath);
  const invariant = templateInvariants.templates[templatePath];
  if (!invariant) {
    fail(`${templatePath} is missing from references/template-invariants.json.`);
    continue;
  }

  if (!skill.includes(path.basename(templatePath, '.html'))) {
    fail(`SKILL.md must list ${path.basename(templatePath, '.html')} in the seed template table.`);
  }

  const lint = spawnSync(process.execPath, ['scripts/lint-design.js', templatePath, '--json'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (lint.status !== 0) {
    fail(`${templatePath} must pass design lint; exit=${lint.status}\n${lint.stdout || lint.stderr}`);
    continue;
  }
  const parsed = JSON.parse(lint.stdout);
  if (parsed.summary.p0 !== 0) {
    fail(`${templatePath} has P0 design lint violations (must fix): ${lint.stdout}`);
  }

  if (!/pptxgen\.bundle\.js/i.test(template) || !/pptx-export-btn|Reveal\.js PPTX 导出按钮/i.test(template)) {
    fail(`${templatePath} must inline the browser PPTX exporter and load pptxgenjs, matching the HTML output contract.`);
  }

  if (!invariant.domain || !invariant.designGrammar) {
    fail(`${templatePath} invariant must name its domain and designGrammar.`);
  }

  if (!invariant.coverClass || genericMarkerRe.test(invariant.coverClass)) {
    fail(`${templatePath} invariant must define a non-generic coverClass.`);
  } else if (coverClassOwners.has(invariant.coverClass)) {
    fail(`${templatePath} reuses coverClass "${invariant.coverClass}" already owned by ${coverClassOwners.get(invariant.coverClass)}.`);
  } else {
    coverClassOwners.set(invariant.coverClass, templatePath);
  }

  if (!classMarkerExists(template, invariant.coverClass)) {
    fail(`${templatePath} must expose native cover grammar class "${invariant.coverClass}" to avoid color-only reskins.`);
  }

  const coverSection = extractSectionByClass(template, invariant.coverClass);
  if (!coverSection) {
    fail(`${templatePath} must have a cover <section> using "${invariant.coverClass}".`);
  }

  if (!Array.isArray(invariant.coverObjects) || invariant.coverObjects.length < 4) {
    fail(`${templatePath} invariant must define at least four cover-scoped native objects.`);
  } else {
    for (const marker of invariant.coverObjects) {
      if (genericMarkerRe.test(marker)) {
        fail(`${templatePath} uses generic cover object marker "${marker}".`);
      }
      if (!classMarkerExists(coverSection, marker)) {
        fail(`${templatePath} cover must include native object "${marker}" in the first slide, not only elsewhere in the deck.`);
      }
    }
  }

  if (!Array.isArray(invariant.deckObjects) || invariant.deckObjects.length < 3) {
    fail(`${templatePath} invariant must define at least three full-deck native proof objects.`);
  } else {
    for (const marker of invariant.deckObjects) {
      if (genericMarkerRe.test(marker)) {
        fail(`${templatePath} uses generic deck object marker "${marker}".`);
      }
      if (!classMarkerExists(template, marker)) {
        fail(`${templatePath} must include native interface object "${marker}" so it cannot collapse back to a generic title/object cover.`);
      }
    }
  }

  const roleMarkers = invariant.roleMarkers || {};
  for (const role of ['cover', 'proof', 'mechanism', 'close']) {
    if (!roleMarkers[role] || !classMarkerExists(template, roleMarkers[role])) {
      fail(`${templatePath} must define and render a ${role} role marker in references/template-invariants.json.`);
    }
  }
  if (new Set(Object.values(roleMarkers)).size < 4) {
    fail(`${templatePath} role markers must use four distinct classes for cover/proof/mechanism/close.`);
  }

  for (const marker of invariant.forbidden || []) {
    if (classMarkerExists(template, marker) || cssClassSelectorExists(template, marker)) {
      fail(`${templatePath} still uses fallback cover object "${marker}"; use the stronger native composition instead.`);
    }
  }

  assertPhysicalContract(templatePath, template, invariant);
}

if (!/Skeleton Reskin Gate|骨架换皮门禁/.test(skill)) {
  fail('SKILL.md must include a skeleton reskin gate requiring structural redesign beyond colors and fonts.');
}

const templateAudit = read('references/template-differentiation-audit.md');
[
  ['contact-sheet evidence', /contact-sheet|并排|side-by-side|首页截图/i],
  ['post-G004 verdict', /Post-G004 Verdict|G004 修复后/i],
  ['all 5 object checklist', /5[\s\S]{0,80}(template|模板)[\s\S]{0,120}(native|原生|对象)/i],
  ['weak cover fallback ban', /fallback|退回|换皮/i],
  ['template invariants manifest', /template-invariants\.json/],
].forEach(([label, pattern]) => {
  if (!pattern.test(templateAudit)) {
    fail(`references/template-differentiation-audit.md is missing ${label}.`);
  }
});

const pipelinePhases = read('references/pipeline-phases.md');
[
  ['validate total>0 blocker', /total\s*>\s*0[\s\S]{0,120}(阻断|blocker|必须修复)/i],
  ['native grammar visual QA', /原生语法|Native Grammar/i],
  ['evidence ledger visual QA', /证据台账|Evidence Ledger/i],
].forEach(([label, pattern]) => {
  if (!pattern.test(pipelinePhases)) {
    fail(`references/pipeline-phases.md is missing ${label}.`);
  }
});

const designPolish = read('references/design-polish.md');
[
  ['native grammar section', /原生语法|Native Grammar/i],
  ['xiaohongshu waterfall primitives', /小红书[\s\S]{0,240}(瀑布流|笔记卡|搜索框|评论区|收藏|标签)/],
  ['disclosure is not source enough', /公开披露[\s\S]{0,160}(不够|不能|不得|不足)/],
].forEach(([label, pattern]) => {
  if (!pattern.test(designPolish)) {
    fail(`references/design-polish.md is missing ${label}.`);
  }
});

const fixturePath = 'tests/fixtures/public-ready-patterns.html';
const fixtureAbs = path.join(root, fixturePath);
if (!fs.existsSync(fixtureAbs)) {
  fail(`${fixturePath} is missing; add a public-ready fixture covering data, framework, and icon/text stress slides.`);
} else {
  const fixture = read(fixturePath);
  const expectedMarkers = [
    ['data-pattern', /class="[^"]*\bdata-pattern\b/],
    ['framework-pattern', /class="[^"]*\bframework-pattern\b/],
    ['icon-text-pattern', /class="[^"]*\bicon-text-pattern\b/],
    ['data source', /数据来源|Source/i],
    ['canonical color token', /--c-accent/],
    ['currentColor icons', /stroke="currentColor"/],
  ];

  for (const [label, pattern] of expectedMarkers) {
    if (!pattern.test(fixture)) {
      fail(`${fixturePath} is missing ${label}.`);
    }
  }

  if (/\.map-node\s*\{[^}]*position\s*:\s*absolute/i.test(fixture) ||
      /class="[^"]*\bmap-node\b[^"]*"[^>]*style="[^"]*(?:left|right|top|bottom)\s*:/i.test(fixture)) {
    fail(`${fixturePath} must not position content nodes absolutely; use grid/flex placement with an SVG connector layer.`);
  }

  const lint = spawnSync(process.execPath, ['scripts/lint-design.js', fixturePath, '--json'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (lint.status !== 0) {
    fail(`${fixturePath} must pass design lint; exit=${lint.status}\n${lint.stdout || lint.stderr}`);
  } else {
    const parsed = JSON.parse(lint.stdout);
    if (parsed.summary.p0 !== 0 || parsed.summary.p1 !== 0) {
      fail(`${fixturePath} has P0/P1 design issues: ${lint.stdout}`);
    }
  }
}

if (failures.length) {
  console.error('Reference contract failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Reference contract passed.');
