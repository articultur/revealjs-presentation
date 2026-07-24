#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const htmlFile = process.argv[2];
if (!htmlFile) {
  console.error('Usage: node scripts/test-browser-viewport.js <deck.html>');
  process.exit(2);
}

const absolute = path.resolve(htmlFile);
if (!fs.existsSync(absolute)) {
  console.error(`File not found: ${absolute}`);
  process.exit(2);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`file://${absolute}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.Reveal && window.Reveal.isReady(), null, { timeout: 10000 });

  const failures = await page.evaluate(async () => {
    const slides = window.Reveal.getSlides();
    const problems = [];
    for (let index = 0; index < slides.length; index += 1) {
      const slide = slides[index];
      const indices = window.Reveal.getIndices(slide);
      window.Reveal.slide(indices.h, indices.v || 0, 0);
      window.Reveal.layout();
      await new Promise((resolve) => setTimeout(resolve, 120));
      const current = window.Reveal.getCurrentSlide();
      const rect = current.getBoundingClientRect();
      const heading = current.querySelector('h1, h2, [data-main-claim], .hero-title');
      const headingRect = heading ? heading.getBoundingClientRect() : null;
      const visible = rect.bottom > 0
        && rect.right > 0
        && rect.top < window.innerHeight
        && rect.left < window.innerWidth;
      const headingVisible = !headingRect || (
        headingRect.bottom > 0
        && headingRect.right > 0
        && headingRect.top < window.innerHeight
        && headingRect.left < window.innerWidth
      );
      if (!visible || !headingVisible) {
        problems.push({
          slide: index + 1,
          visible,
          headingVisible,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          headingRect: headingRect ? { x: headingRect.x, y: headingRect.y, width: headingRect.width, height: headingRect.height } : null,
        });
      }
    }
    return problems;
  });

  await browser.close();
  if (failures.length) {
    console.error(JSON.stringify(failures, null, 2));
    process.exit(1);
  }
  console.log('Browser viewport contract: PASS');
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(2);
});
