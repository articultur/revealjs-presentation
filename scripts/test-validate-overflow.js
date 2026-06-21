#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const fixture = path.join(root, 'tests/fixtures/overflow.html');
const validate = path.join(root, 'scripts/validate.js');
const screenshot = fixture.replace(/\.html?$/i, '-overflow.png');
const slideScreenshot = fixture.replace(/\.html?$/i, '-overflow-slide-1.png');

try {
  require('fs').rmSync(screenshot, { force: true });
  require('fs').rmSync(slideScreenshot, { force: true });
} catch {}

const result = spawnSync(process.execPath, [validate, fixture], {
  cwd: root,
  encoding: 'utf8',
});

try {
  require('fs').rmSync(screenshot, { force: true });
  require('fs').rmSync(slideScreenshot, { force: true });
} catch {}

if (result.status === 0) {
  process.stderr.write('Expected validate.js to fail on intentional overflow, but it exited 0.\n');
  process.stderr.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exit(1);
}

process.stdout.write('validate.js failed on intentional overflow as expected.\n');
