#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { stageMedia } = require('./media-stage');

(async () => {
  const fixture = path.join(__dirname, '..', 'tests', 'fixtures', 'media', 'tiny-source.svg');
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'media-stage-'));
  const fixturesRoot = path.join(__dirname, '..', 'tests', 'fixtures');

  // Dedup: same source twice → same relativePath + stable sha
  const first = await stageMedia({ source: fixture, outputDir, allowRoot: fixturesRoot });
  const second = await stageMedia({ source: fixture, outputDir, allowRoot: fixturesRoot });
  assert.strictEqual(first.relativePath, second.relativePath, 'dedup must reuse identical file');
  assert.match(first.sha256, /^[a-f0-9]{64}$/, 'sha256 must be 64 hex chars');
  assert.strictEqual(first.mimeType, 'image/svg+xml', 'svg mimeType must be detected');

  // SSRF / path-traversal guards
  await assert.rejects(
    () => stageMedia({ source: '/etc/passwd', outputDir, allowRoot: fixturesRoot }),
    /outside allowRoot/,
  );
  await assert.rejects(
    () => stageMedia({ source: 'http://127.0.0.1:3000/private.png', outputDir, allowRoot: fixturesRoot }),
    /private network/,
  );

  console.log('Media stage contract: PASS');
})().catch((e) => {
  console.error(e.stack || e.message);
  process.exit(1);
});
