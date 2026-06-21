#!/usr/bin/env node
/**
 * Spatial Integrity Detector
 * ─────────────────────────────────────────────────────────────
 * Catches visual-coordinate bugs that ordinary overflow checks miss:
 *   1. Drawing/proof objects that drift outside their material surface
 *      (for example a floor plan sliding below its blueprint sheet).
 *   2. SVG text whose rendered bbox extends outside the SVG viewport,
 *      producing clipped dimension labels while the outer SVG still passes.
 *   3. SVG text inheriting a visible stroke from a parent SVG/group,
 *      making diagram labels look muddy at projection scale.
 *
 * Usage:
 *   node scripts/test-spatial-integrity.js <file.html> [<file2.html> ...]
 *
 * Exit codes:
 *   0 — no spatial integrity issues
 *   1 — at least one real issue
 *   2 — usage/dependency error
 */

'use strict';

const fs = require('fs');
const path = require('path');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (err) {
  console.error('Missing dependency: playwright. Run `npm install playwright` first.');
  process.exit(2);
}

const files = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (!files.length) {
  console.error('Usage: node scripts/test-spatial-integrity.js <file.html> [<file2.html> ...]');
  process.exit(2);
}

const ROOT = path.resolve(__dirname, '..');
const INVARIANTS_PATH = path.join(ROOT, 'references/template-invariants.json');

function normalizedRelative(file) {
  return path.relative(ROOT, path.resolve(file)).split(path.sep).join('/');
}

function readPhysicalContract(file) {
  if (!fs.existsSync(INVARIANTS_PATH)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(INVARIANTS_PATH, 'utf8'));
    return parsed.templates?.[normalizedRelative(file)]?.physicalContract || null;
  } catch {
    return null;
  }
}

(async () => {
  const browser = await chromium.launch();
  let issueCount = 0;
  let filesWithIssues = 0;

  for (const file of files) {
    const abs = path.resolve(file);
    if (!fs.existsSync(abs)) {
      console.error(`  ✗  not found: ${file}`);
      issueCount++;
      continue;
    }

    const physicalContract = readPhysicalContract(abs);
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto('file://' + abs, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const slideCount = await page.evaluate(() =>
      document.querySelectorAll('.reveal .slides > section').length
    );

    const issues = [];
    for (let i = 0; i < slideCount; i++) {
      await page.evaluate(idx => window.Reveal && window.Reveal.slide(idx, 0), i);
      await page.waitForTimeout(120);

      const slideIssues = await page.evaluate(({ slideIndex, physicalContract }) => {
        const TOL = 2;
        const present = document.querySelector('.reveal .slides > section.present');
        if (!present) return [];

        function isVisible(el) {
          if (!el || !el.isConnected) return false;
          if (el.closest('[data-qa-ignore="decorative"]')) return false;
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false;
          const r = el.getBoundingClientRect();
          return r.width > 2 && r.height > 2;
        }

        function isRendered(el) {
          if (!el || !el.isConnected) return false;
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false;
          const r = el.getBoundingClientRect();
          return r.width > 2 && r.height > 2;
        }

        function rect(el) {
          const r = el.getBoundingClientRect();
          return {
            left: r.left, top: r.top, right: r.right, bottom: r.bottom,
            width: r.width, height: r.height,
          };
        }

        function label(el) {
          const cls = typeof el.className === 'string'
            ? el.className.split(/\s+/).filter(Boolean).slice(0, 3).join('.')
            : '';
          const tag = el.tagName.toLowerCase();
          const text = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 36);
          return `${tag}${cls ? '.' + cls : ''}${text ? ` "${text}"` : ''}`;
        }

        function hasVisibleStroke(el) {
          const cs = getComputedStyle(el);
          const width = parseFloat(cs.strokeWidth || '0');
          const stroke = (cs.stroke || '').trim().toLowerCase();
          if (!Number.isFinite(width) || width <= 0.05) return false;
          if (!stroke || stroke === 'none' || stroke === 'transparent') return false;
          if (/rgba?\([^)]*,\s*0(?:\.0+)?\s*\)$/.test(stroke)) return false;
          return true;
        }

        function isDataCurveSvg(svg) {
          const haystack = [
            svg.getAttribute('aria-label') || '',
            svg.getAttribute('class') || '',
            svg.closest('section')?.className || '',
            svg.closest('[class]')?.className || '',
            svg.textContent || '',
          ].join(' ').toLowerCase();
          return /chart|trend|curve|sparkline|loss|scale|scaling|slope|parameter|metric|kpi|axis|数据|趋势|曲线|参数|指标/.test(haystack);
        }

        function spill(inner, outer) {
          return {
            left: Math.max(0, outer.left - inner.left),
            top: Math.max(0, outer.top - inner.top),
            right: Math.max(0, inner.right - outer.right),
            bottom: Math.max(0, inner.bottom - outer.bottom),
          };
        }

        function intersection(a, b) {
          const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
          const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
          return { width, height, area: width * height };
        }

        const results = [];
        const scale = window.Reveal && typeof Reveal.getScale === 'function' ? Reveal.getScale() : 1;
        const scaled = (px) => px * scale;

        function all(selector, root = present) {
          if (!selector) return [];
          try {
            return Array.from(root.querySelectorAll(selector)).filter(isVisible);
          } catch {
            return [];
          }
        }

        function one(selector, root = present) {
          if (!selector) return null;
          try {
            const el = root.querySelector(selector);
            return isVisible(el) ? el : null;
          } catch {
            return null;
          }
        }

        function pushContractIssue(kind, rule, item, surface, spillValues = {}) {
          results.push({
            slide: slideIndex + 1,
            kind,
            rule: rule?.name || null,
            item: item ? label(item) : rule?.subject || rule?.a || '',
            surface: surface ? label(surface) : rule?.container || rule?.b || '',
            spill: Object.fromEntries(
              Object.entries(spillValues).map(([key, value]) => [key, Math.round(value)])
            ),
          });
        }

        function runPhysicalContract(contract) {
          if (!contract || typeof contract !== 'object') return;

          for (const rule of contract.surfaceRules || []) {
            const surface = one(rule.surface);
            if (!surface) continue;
            const maxSpill = Number.isFinite(rule.maxSpillPx) ? rule.maxSpillPx : TOL;
            const surfaceRect = rect(surface);
            for (const selector of rule.contents || []) {
              for (const item of all(selector)) {
                if (item === surface) continue;
                if (rule.requireOwnership !== false && !surface.contains(item)) {
                  pushContractIssue('PHYSICAL_SURFACE_OWNERSHIP', rule, item, surface);
                }
                const itemRect = rect(item);
                const s = spill(itemRect, surfaceRect);
                if (s.left > maxSpill || s.top > maxSpill || s.right > maxSpill || s.bottom > maxSpill) {
                  pushContractIssue('PHYSICAL_SURFACE_CONTAINMENT', rule, item, surface, s);
                }
              }
            }
          }

          for (const rule of contract.exclusionRules || []) {
            const a = one(rule.a);
            const b = one(rule.b);
            if (!a || !b) continue;
            const hit = intersection(rect(a), rect(b));
            const maxArea = Number.isFinite(rule.maxIntersectionArea) ? rule.maxIntersectionArea : 0;
            if (hit.area > maxArea) {
              pushContractIssue('PHYSICAL_SURFACE_INTRUSION', rule, a, b, {
                left: hit.width,
                top: hit.height,
                right: hit.area,
              });
            }
          }

          for (const rule of contract.alignmentRules || []) {
            const subject = one(rule.subject);
            const target = one(rule.target);
            if (!subject || !target) continue;
            const sr = rect(subject);
            const tr = rect(target);
            const maxDelta = Number.isFinite(rule.maxDeltaPx) ? rule.maxDeltaPx : TOL;
            if (rule.type === 'horizontalEdges') {
              const leftDelta = Math.abs(sr.left - tr.left);
              const rightDelta = Math.abs(sr.right - tr.right);
              if (leftDelta > maxDelta || rightDelta > maxDelta) {
                pushContractIssue('PHYSICAL_ALIGNMENT_DRIFT', rule, subject, target, {
                  left: leftDelta,
                  right: rightDelta,
                });
              }
            }
          }

          for (const rule of contract.placementRules || []) {
            const subject = one(rule.subject);
            const container = one(rule.container);
            if (!subject || !container) continue;
            const sr = rect(subject);
            const cr = rect(container);
            const leftInset = sr.left - cr.left;
            const topInset = sr.top - cr.top;
            const bottomClearance = cr.bottom - sr.bottom;
            const failLeft = Number.isFinite(rule.maxLeftInsetPx) && leftInset > scaled(rule.maxLeftInsetPx);
            const failTop = Number.isFinite(rule.maxTopInsetPx) && topInset > scaled(rule.maxTopInsetPx);
            const failBottom = Number.isFinite(rule.minBottomClearancePx) && bottomClearance < scaled(rule.minBottomClearancePx);
            if (failLeft || failTop || failBottom) {
              pushContractIssue('PHYSICAL_PLACEMENT_DRIFT', rule, subject, container, {
                left: leftInset,
                top: topInset,
                bottom: bottomClearance,
              });
            }
          }

          for (const rule of contract.collisionRules || []) {
            const scope = one(rule.scope) || present;
            const aItems = all(rule.a, scope);
            let bItems = all(rule.b, scope);
            if (rule.bTextPattern) {
              const pattern = new RegExp(rule.bTextPattern);
              bItems = bItems.filter(el => pattern.test(el.textContent || ''));
            }
            const maxWidth = Number.isFinite(rule.maxIntersectionWidthPx) ? rule.maxIntersectionWidthPx : TOL;
            const maxHeight = Number.isFinite(rule.maxIntersectionHeightPx) ? rule.maxIntersectionHeightPx : TOL;
            for (const a of aItems) {
              const ar = rect(a);
              for (const b of bItems) {
                if (a === b) continue;
                const hit = intersection(ar, rect(b));
                if (hit.width > maxWidth && hit.height > maxHeight) {
                  pushContractIssue('PHYSICAL_OBJECT_COLLISION', rule, a, b, {
                    left: hit.width,
                    top: hit.height,
                  });
                }
              }
            }
          }
        }

        runPhysicalContract(physicalContract);

        const frame = present.querySelector('.sheet-frame');
        if (frame && isRendered(frame)) {
          const fr = rect(frame);
          const pageLabels = Array.from(present.querySelectorAll('.kicker')).filter(el =>
            isVisible(el) && !el.closest('.cover-title-area') && !el.closest('.void-body')
          );
          for (const item of pageLabels) {
            const ir = rect(item);
            if (ir.top < fr.top + scaled(8)) {
              results.push({
                slide: slideIndex + 1,
                kind: 'PAGE_LABEL_FRAME_COLLISION',
                item: label(item),
                surface: label(frame),
                spill: { top: Math.round((fr.top + scaled(8)) - ir.top) },
              });
            }
          }
        }

        const northMark = present.querySelector('.north-mark');
        if (northMark && isVisible(northMark)) {
          const nr = rect(northMark);
          for (const heading of Array.from(present.querySelectorAll('h1, h2')).filter(isVisible)) {
            const hit = intersection(nr, rect(heading));
            if (hit.area > scaled(4)) {
              results.push({
                slide: slideIndex + 1,
                kind: 'NORTH_MARK_HEADING_COLLISION',
                item: label(northMark),
                surface: label(heading),
                spill: { left: Math.round(hit.width), top: Math.round(hit.height), right: Math.round(hit.area) },
              });
            }
          }
        }

        for (const pin of Array.from(present.querySelectorAll('.pin')).filter(isVisible)) {
          const pr = rect(pin);
          const unsafe = Array.from(present.querySelectorAll('.void-foot, .route-board, .matrix-grid, .cover-bottom')).filter(isVisible);
          for (const item of unsafe) {
            const hit = intersection(pr, rect(item));
            if (hit.area > scaled(4)) {
              results.push({
                slide: slideIndex + 1,
                kind: 'PAGE_PIN_OBJECT_COLLISION',
                item: label(pin),
                surface: label(item),
                spill: { left: Math.round(hit.width), top: Math.round(hit.height), right: Math.round(hit.area) },
              });
            }
          }
        }

        const surfaceRules = [
          {
            surface: '.blueprint-sheet',
            contents: '.plan-drawing, .dimension-chain, .plate-notes, [data-qa-contained-by="blueprint-sheet"]',
          },
          {
            surface: '[data-qa-surface]',
            contents(surface) {
              const name = surface.getAttribute('data-qa-surface');
              return name ? `[data-qa-contained-by="${CSS.escape(name)}"]` : '';
            },
          },
        ];

        for (const rule of surfaceRules) {
          for (const surface of Array.from(present.querySelectorAll(rule.surface)).filter(isVisible)) {
            const surfaceRect = rect(surface);
            const selector = typeof rule.contents === 'function' ? rule.contents(surface) : rule.contents;
            if (!selector) continue;
            for (const item of Array.from(present.querySelectorAll(selector)).filter(isVisible)) {
              if (surface.contains(item)) continue;
              const itemRect = rect(item);
              const s = spill(itemRect, surfaceRect);
              if (s.left > TOL || s.top > TOL || s.right > TOL || s.bottom > TOL) {
                results.push({
                  slide: slideIndex + 1,
                  kind: 'SURFACE_CONTAINMENT',
                  item: label(item),
                  surface: label(surface),
                  spill: {
                    left: Math.round(s.left),
                    top: Math.round(s.top),
                    right: Math.round(s.right),
                    bottom: Math.round(s.bottom),
                  },
                });
              }
            }
          }
        }

        const cover = present.classList.contains('spatial-cover') ? present : null;
        if (cover) {
          const blueprint = cover.querySelector('.blueprint-sheet');
          const plan = cover.querySelector('.plan-drawing');
          const dim = cover.querySelector('.dimension-chain');
          const notes = cover.querySelector('.plate-notes');
          const frame = cover.querySelector('.sheet-frame');
          const coverBottom = cover.querySelector('.cover-bottom');
          const coverTitle = cover.querySelector('.cover-title-area');
          const titleBlock = cover.querySelector('.title-block');
          const ownedItems = [plan, dim, notes].filter(Boolean);
          const scale = window.Reveal && typeof Reveal.getScale === 'function' ? Reveal.getScale() : 1;
          const scaled = (px) => px * scale;
          const intersection = (a, b) => {
            const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
            const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
            return { width, height, area: width * height };
          };

          if (blueprint && isVisible(blueprint)) {
            for (const item of ownedItems) {
              if (!blueprint.contains(item)) {
                results.push({
                  slide: slideIndex + 1,
                  kind: 'SURFACE_OWNERSHIP',
                  item: label(item),
                  surface: label(blueprint),
                  spill: {},
                });
              }
            }
          }

          const planSvg = plan?.querySelector('svg');
          if (plan && planSvg && isVisible(plan)) {
            const pr = rect(plan);
            const viewBox = planSvg.viewBox?.baseVal;
            if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
              const expectedRatio = viewBox.width / viewBox.height;
              const actualRatio = pr.width / pr.height;
              if (Math.abs(actualRatio - expectedRatio) > 0.04) {
                results.push({
                  slide: slideIndex + 1,
                  kind: 'PLAN_ASPECT_DRIFT',
                  item: label(plan),
                  surface: label(planSvg),
                  spill: {
                    left: Math.round(actualRatio * 100),
                    right: Math.round(expectedRatio * 100),
                  },
                });
              }
            }
          }

          const outerWall = plan?.querySelector('svg rect[stroke-width="3"]');
          if (dim && outerWall && isVisible(dim) && isVisible(outerWall)) {
            const dr = rect(dim);
            const wr = rect(outerWall);
            const leftDelta = Math.abs(dr.left - wr.left);
            const rightDelta = Math.abs(dr.right - wr.right);
            if (leftDelta > 10 || rightDelta > 10) {
              results.push({
                slide: slideIndex + 1,
                kind: 'DIMENSION_WALL_ALIGNMENT',
                item: label(dim),
                surface: label(outerWall),
                spill: {
                  left: Math.round(leftDelta),
                  right: Math.round(rightDelta),
                },
              });
            }
          }

          if (blueprint && titleBlock && isVisible(blueprint) && isVisible(titleBlock)) {
            const hit = intersection(rect(titleBlock), rect(blueprint));
            if (hit.area > 1) {
              results.push({
                slide: slideIndex + 1,
                kind: 'TITLE_BLOCK_GRID_INTRUSION',
                item: label(titleBlock),
                surface: label(blueprint),
                spill: {
                  left: Math.round(hit.width),
                  top: Math.round(hit.height),
                  right: Math.round(hit.area),
                },
              });
            }
          }

          if (frame && coverTitle && isVisible(frame) && isVisible(coverTitle)) {
            const fr = rect(frame);
            const tr = rect(coverTitle);
            if (tr.bottom > fr.bottom + TOL) {
              results.push({
                slide: slideIndex + 1,
                kind: 'COVER_TITLE_FRAME_OVERFLOW',
                item: label(coverTitle),
                surface: label(frame),
                spill: { bottom: Math.round(tr.bottom - fr.bottom) },
              });
            }
          }

          if (coverBottom && titleBlock && isVisible(coverBottom) && isVisible(titleBlock)) {
            if (!coverBottom.contains(titleBlock)) {
              results.push({
                slide: slideIndex + 1,
                kind: 'TITLE_BLOCK_BAND_OWNERSHIP',
                item: label(titleBlock),
                surface: label(coverBottom),
                spill: {},
              });
            }
          }

          if (blueprint && plan && isVisible(blueprint) && isVisible(plan)) {
            const br = rect(blueprint);
            const pr = rect(plan);
            const bottomClearance = br.bottom - pr.bottom;
            if (bottomClearance < scaled(40)) {
              results.push({
                slide: slideIndex + 1,
                kind: 'PLAN_TOO_LOW_IN_FIELD',
                item: label(plan),
                surface: label(blueprint),
                spill: {
                  bottom: Math.round(bottomClearance),
                  top: Math.round(scaled(40)),
                },
              });
            }
            if (pr.left - br.left > scaled(150) || pr.top - br.top > scaled(170)) {
              results.push({
                slide: slideIndex + 1,
                kind: 'PLAN_NOT_LEFT_UP_ENOUGH',
                item: label(plan),
                surface: label(blueprint),
                spill: {
                  left: Math.round(pr.left - br.left),
                  top: Math.round(pr.top - br.top),
                },
              });
            }
          }

          if (plan && isVisible(plan)) {
            const labels = Array.from(plan.querySelectorAll('svg text')).filter(el =>
              /FOYER|READING|CORE|STUDIO|WORK/.test(el.textContent || '') && isVisible(el)
            );
            const markers = Array.from(plan.querySelectorAll('svg circle')).filter(el =>
              el.getAttribute('fill') === 'var(--c-accent)' && isVisible(el)
            );
            for (const text of labels) {
              const tr = rect(text);
              for (const marker of markers) {
                const mr = rect(marker);
                const hit = intersection(tr, mr);
                if (hit.width > 2 && hit.height > 2) {
                  results.push({
                    slide: slideIndex + 1,
                    kind: 'PLAN_MARKER_LABEL_OVERLAP',
                    item: label(marker),
                    surface: label(text),
                    spill: {
                      left: Math.round(hit.width),
                      top: Math.round(hit.height),
                    },
                  });
                }
              }
            }
          }
        }

        for (const text of Array.from(present.querySelectorAll('svg text')).filter(isVisible)) {
          const svg = text.ownerSVGElement;
          if (!svg || text.closest('[data-qa-ignore="decorative"]')) continue;
          if (hasVisibleStroke(text)) {
            results.push({
              slide: slideIndex + 1,
              kind: 'SVG_TEXT_STROKE',
              item: label(text),
              surface: label(svg),
              spill: {},
            });
          }
          const textRect = rect(text);
          const svgRect = rect(svg);
          const s = spill(textRect, svgRect);
          if (s.left > TOL || s.top > TOL || s.right > TOL || s.bottom > TOL) {
            results.push({
              slide: slideIndex + 1,
              kind: 'SVG_TEXT_CLIP',
              item: label(text),
              surface: label(svg),
              spill: {
                left: Math.round(s.left),
                top: Math.round(s.top),
                right: Math.round(s.right),
                bottom: Math.round(s.bottom),
              },
            });
          }
        }

        for (const svg of Array.from(present.querySelectorAll('svg')).filter(isVisible)) {
          if (svg.closest('[data-qa-ignore="decorative"]') || !isDataCurveSvg(svg)) continue;
          for (const path of Array.from(svg.querySelectorAll('path'))) {
            const d = path.getAttribute('d') || '';
            if (/(^|[\s,])T[\s,.-]*\d/i.test(d)) {
              results.push({
                slide: slideIndex + 1,
                kind: 'SVG_DATA_CURVE_SMOOTH_T',
                item: label(path),
                surface: label(svg),
                spill: {},
              });
            }
          }
        }

        return results;
      }, { slideIndex: i, physicalContract });

      issues.push(...slideIssues);
    }

    await page.close();

    if (issues.length === 0) {
      console.log(`  ✓  ${path.basename(file)} — spatial integrity clear on all ${slideCount} slide(s)`);
    } else {
      filesWithIssues++;
      issueCount += issues.length;
      console.log(`  ✗  ${path.basename(file)} — ${issues.length} spatial issue(s):`);
      for (const it of issues) {
        const s = it.spill || {};
        console.log(`     slide ${it.slide}: ${it.kind} ${it.item} outside ${it.surface} ` +
          `(L${s.left || 0}/T${s.top || 0}/R${s.right || 0}/B${s.bottom || 0}px)`);
      }
    }
  }

  await browser.close();

  if (issueCount > 0) {
    console.log(`\nSpatial integrity failed: ${issueCount} issue(s) in ${filesWithIssues} file(s).`);
    process.exit(1);
  }
  console.log('\nOK: spatial integrity clear.');
})();
