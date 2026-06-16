#!/usr/bin/env node
'use strict';

/**
 * Reference Doc Lint — prevents SKILL.md hard rules from being silently
 * contradicted by code examples in reference .md files.
 *
 * Scans reference/** *.md for:
 *   R1  Negative tracking in CSS/html code blocks  → hard rule #4
 *   R2  vw/vh units in CSS/html code blocks        → §1 output constraint
 *   R3  Tailwind indigo (#6366f1 etc.) as accent   → hard rule #5
 *   R4  font-weight: 700+ in CSS/html code blocks  → design-principles weight range
 *   R5  Emoji used as icons                        → hard rule #6
 *
 * Usage:
 *   node scripts/lint-reference-docs.js
 *   node scripts/lint-reference-docs.js --json
 *
 * Exit codes:
 *   0 — clean
 *   1 — violations found (P0-equivalent for reference docs)
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const jsonOnly = args.includes('--json');

const REFS_DIR = path.resolve(__dirname, '..', 'references');
const rules = [
  {
    id: 'R1',
    name: 'NEGATIVE_TRACKING_IN_REF',
    desc: 'negative tracking (letter-spacing: -0.0Xem) contradicts hard rule #4',
    pattern: /letter-spacing\s*:\s*-0\.0[1-9]em/gi,
    severity: 'P0',
  },
  {
    id: 'R2',
    name: 'VW_VH_IN_REF',
    desc: 'vw/vh unit contradicts §1 output constraint (Reveal transform:scale incompatibility)',
    pattern: /(?:\d+(?:\.\d+)?)\s*v[wvh]\b/gi,
    severity: 'P0',
  },
  {
    id: 'R3',
    name: 'TAILWIND_INDIGO_IN_REF',
    desc: 'Tailwind indigo (#6366f1 / #4f46e5 / #8b5cf6) or near neighbors as accent color',
    pattern: /#[46][0-9a-fA-F]{2}[eE][0-9a-fA-F]{2}|#8[bB]5[cC][fF]6|#63[6-9][0-9a-fA-F][fF][1-9]|indigo-5[0-9]0/gi,
    severity: 'P0',
  },
  {
    id: 'R4',
    name: 'FONT_WEIGHT_700_IN_REF',
    desc: 'font-weight: 700+ in code examples contradicts 200-600 weight range',
    pattern: /font-weight\s*:\s*(?:700|800|900)\b/gi,
    severity: 'P1',
  },
  {
    id: 'R5',
    name: 'EMOJI_ICON_IN_REF',
    desc: 'emoji used as icon contradicts hard rule #6',
    pattern: /[\u{1F300}-\u{1F9FF}](?:\s*[\/·]\s*[\u{1F300}-\u{1F9FF}])?/gu,
    severity: 'P1',
  },
];

const results = [];
let totalViolations = 0;

const files = fs.readdirSync(REFS_DIR).filter(f => f.endsWith('.md'));

for (const file of files) {
  const filePath = path.join(REFS_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const fileViolations = [];

  for (const rule of rules) {
    // Reset lastIndex for regexes with global flag
    rule.pattern.lastIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      rule.pattern.lastIndex = 0;
      let match;
      while ((match = rule.pattern.exec(line)) !== null) {
        // Skip lines that aren't inside code blocks
        if (!isInCodeBlock(lines, i)) continue;
        // Skip lines that are comments (/* ... */ or //)
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;
        // Skip lines that are markdown table separators
        if (/^\|[-: |]+\|$/.test(trimmed)) continue;
        // Skip lines that document the rule (listing forbidden values as examples)
        if (isRuleDocumentation(lines, i)) continue;

        fileViolations.push({
          rule: rule.id,
          severity: rule.severity,
          line: i + 1,
          snippet: trimmed.slice(0, 80),
          desc: rule.desc,
        });
        totalViolations++;
      }
    }
  }

  if (fileViolations.length > 0) {
    results.push({ file, violations: fileViolations });
    if (!jsonOnly) {
      console.log(`\n${file}:`);
      for (const v of fileViolations) {
        console.log(`  [${v.rule}|${v.severity}] L${v.line}: ${v.snippet}`);
      }
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────

// Lines that *document* a rule (in prose or tables) using the forbidden
// pattern as a counterexample — not in a code block teaching the pattern.
function isRuleDocumentation(lines, lineIdx) {
  const line = lines[lineIdx];
  // Markdown table data row: check both the row itself and nearby context
  // (table header row typically has column labels like "禁止" / "避免")
  if (/^\|/.test(line)) {
    // Check this row
    if (/禁止|避免|不要|不用|替代|反模式|❌|必须用|指纹/i.test(line)) return true;
    // Check up to 6 lines back for a table header with prohibition keywords
    for (let j = Math.max(0, lineIdx - 6); j < lineIdx; j++) {
      if (/^\|.*(?:禁止|避免|不要|不用|替代|反模式|❌|P0|必须|指纹).*\|/i.test(lines[j])) return true;
    }
  }
  // Prose lines outside tables
  return /P0 硬规则|Impeccable 绝对禁令|标志性指纹/.test(line);
}

function isInCodeBlock(lines, lineIdx) {
  let insideFence = false;
  for (let i = 0; i <= lineIdx; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      insideFence = !insideFence;
    }
  }
  return insideFence;
}

// ─── Summary ──────────────────────────────────────────────────

const p0Violations = results.reduce(
  (s, r) => s + r.violations.filter(v => v.severity === 'P0').length, 0
);

if (jsonOnly) {
  console.log(JSON.stringify({
    passed: p0Violations === 0,
    p0Violations,
    totalViolations,
    filesChecked: files.length,
    results,
  }, null, 2));
} else {
  if (totalViolations === 0) {
    console.log('\n✓  Reference docs clean — no hard-rule contradictions in code examples.');
  } else {
    console.log(`\n✗  ${totalViolations} violation(s) across ${results.length} file(s) (${p0Violations} P0).`);
    console.log('   Fix: align reference code examples with SKILL.md hard rules, then re-run.');
  }
}

process.exit(p0Violations > 0 ? 1 : 0);
