#!/usr/bin/env node
'use strict';

/**
 * Evidence Ledger Gate — ensures all precise numbers in the deck carry
 * a verifiable source label (verified / user-provided / illustrative).
 *
 * Scans each <section> for numbers that look like real metrics (not CSS
 * values, slide counters, or dates) and checks whether an evidence label
 * appears nearby.  Numbers without a label are flagged.
 *
 * Usage:
 *   node scripts/test-evidence-ledger.js <file.html> [<file2.html> ...]
 *
 * Exit codes:
 *   0 — all numbers backed by evidence (or no metrics detected)
 *   1 — at least one unlabeled number found (blocking for delivery)
 *   2 — usage error / file not found
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const files = args.filter(a => !a.startsWith('--'));

if (!files.length) {
  console.error('Usage: node scripts/test-evidence-ledger.js <file.html> [<file2.html> ...]');
  process.exit(2);
}

// ─── Helpers ──────────────────────────────────────────────────

// Labels that count as evidence markers
const EVIDENCE_RE = /\b(?:verified|user-provided|illustrative|needs-source)\b/gi;

// Numbers to ignore — CSS units, slide counters, years, version numbers, dates
const IGNORE_RE = /\b(?:\d+(?:\.\d+)?\s*(?:em|px|rem|%|vh|vw|ch|s|ms|deg)\b|(?:19|20)\d{2}(?!\d)|v\d+\.\d+|#[0-9a-fA-F]{3,8})\b/gi;
// Date / version strings: "2026.03", "2026.03.14", "02.2026", "03.15"
const DATE_RE = /\b\d{4}\.\d{2}(?:\.\d{2})?\b|\b\d{2}\.\d{4}\b|\b\d{2}\.\d{2}\b/g;

// Precise-number patterns: percentages, large integers (≥1000), decimals
// with 1-2 fractional digits, and K/M/B suffix forms
const METRIC_RE = /\b(?:\d{1,3}(?:,\d{3})+|\d{4,}(?:\.\d+)?|\d+\.\d{1,2}%?|\d+\s*[KkMmBb])\b/g;

function stripHtmlTags(str) {
  return str.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

function findEvidenceLabels(text) {
  // Look for evidence labels near the metric
  const matches = [];
  let m;
  EVIDENCE_RE.lastIndex = 0;
  while ((m = EVIDENCE_RE.exec(text)) !== null) {
    matches.push(m[0].toLowerCase());
  }
  return matches;
}

// ─── Main ─────────────────────────────────────────────────────

const allViolations = [];
let missingCount = 0;

for (const file of files) {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    console.error(`  ✗  not found: ${file}`);
    missingCount++;
    continue;
  }

  const html = fs.readFileSync(abs, 'utf8');
  const violations = [];

  // Find all <section>…</section> blocks by tag-counting
  const sectionRe = /<section[^>]*>|<\/section>/gi;
  const sectionTags = [];
  let sm;
  while ((sm = sectionRe.exec(html)) !== null) {
    sectionTags.push({ index: sm.index, tag: sm[0], isOpen: !/<\/section>/.test(sm[0]) });
  }

  let slideNo = 0;
  let depth = 0;
  let sectionStart = null;

  for (const tag of sectionTags) {
    if (tag.isOpen) {
      if (depth === 0) sectionStart = tag.index + tag.tag.length;
      depth++;
    } else {
      depth--;
      if (depth === 0 && sectionStart !== null) {
        slideNo++;
        const sectionHTML = html.slice(sectionStart, tag.index);
        const textContent = stripHtmlTags(sectionHTML);

        // Remove dates, versions, bare years, CSS units before metric detection
        let cleanedText = textContent.replace(DATE_RE, '');
        cleanedText = cleanedText.replace(/\bv?\d+\.\d+\.\d+(?:-rc\d*|-beta\d*)?\b/g, ''); // semver: 4.6.1, v4.6.1-rc
        cleanedText = cleanedText.replace(IGNORE_RE, ' '); // strip CSS units, years, versions, hex colors
        cleanedText = cleanedText.replace(/\b(?:19|20)\d{2}\b/g, ''); // bare years

        const labels = findEvidenceLabels(textContent);

        // Find metric-looking numbers in the text
        METRIC_RE.lastIndex = 0;
        let mm;
        while ((mm = METRIC_RE.exec(cleanedText)) !== null) {
          const metric = mm[0];

          // Skip raw numbers that aren't metrics (e.g. "5 元素", "第 12 页")
          const prefix = textContent.slice(Math.max(0, mm.index - 12), mm.index);
          if (/\b(?:第|page|slide|共|[0-9]+\s*[x×]\s*)\s*$/.test(prefix)) continue;

          // If evidence labels exist anywhere on the slide, the metric is considered backed
          if (labels.length === 0) {
            violations.push({
              slide: slideNo,
              metric,
              context: textContent.slice(Math.max(0, mm.index - 20), mm.index + mm[0].length + 20).trim(),
            });
            break; // one violation per slide is enough
          }
        }
        sectionStart = null;
      }
    }
  }

  if (violations.length === 0) {
    console.log(`  ✓  ${path.basename(file)} — ${slideNo} slide(s), all metrics backed by evidence`);
  } else {
    allViolations.push({ file: abs, violations });
    console.log(`  ✗  ${path.basename(file)} — ${violations.length} slide(s) with unlabeled metrics:`);
    for (const v of violations) {
      console.log(`     slide ${v.slide}: "${v.metric}"  context: "${v.context}"`);
    }
  }
}

if (missingCount > 0) {
  console.error(`\nERROR: ${missingCount} file(s) not found.`);
  process.exit(2);
}

if (allViolations.length > 0) {
  const totalSlides = allViolations.reduce((s, fv) => s + fv.violations.length, 0);
  console.log(`\nFAIL: ${totalSlides} slide(s) across ${allViolations.length} file(s) have unlabeled metrics.`);
  console.log('  Fix: add \'verified\', \'user-provided\', or \'illustrative\' label near each precise number.');
  process.exit(1);
}

console.log('\nOK: all metrics backed by evidence labels.');
process.exit(0);
