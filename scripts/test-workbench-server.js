#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createWorkbenchServer } = require('../workbench/server');

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'workbench-'));
  const manifestPath = path.join(tmp, 'deck.manifest.json');
  fs.copyFileSync(
    path.join(__dirname, '..', 'tests', 'fixtures', 'deck-manifest-valid.json'),
    manifestPath,
  );
  const outputRoot = path.join(tmp, 'out');
  fs.mkdirSync(outputRoot, { recursive: true });

  const server = await createWorkbenchServer({ manifestPath, outputRoot, port: 0 });
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    // GET manifest → 200 + ETag
    const first = await fetch(`${base}/api/manifest`);
    assert.strictEqual(first.status, 200, 'GET /api/manifest should be 200');
    const etag = first.headers.get('etag');
    assert.ok(etag, 'ETag must be present');
    const manifest = await first.json();
    manifest.title = '更新后的标题';

    // PUT with matching If-Match → 200
    const saved = await fetch(`${base}/api/manifest`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', 'if-match': etag },
      body: JSON.stringify(manifest),
    });
    assert.strictEqual(saved.status, 200, 'PUT with fresh If-Match should be 200');

    // PUT with stale If-Match → 409
    const stale = await fetch(`${base}/api/manifest`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', 'if-match': etag },
      body: JSON.stringify(manifest),
    });
    assert.strictEqual(stale.status, 409, 'stale If-Match should be 409');

    // PUT without If-Match → 428
    const noMatch = await fetch(`${base}/api/manifest`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(manifest),
    });
    assert.strictEqual(noMatch.status, 428, 'missing If-Match should be 428');

    // PUT invalid manifest → 422
    const invalid = JSON.parse(JSON.stringify(manifest));
    delete invalid.slides;
    const bad = await fetch(`${base}/api/manifest`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', 'if-match': saved.headers.get('etag') },
      body: JSON.stringify(invalid),
    });
    assert.strictEqual(bad.status, 422, 'invalid manifest should be 422');

    // Path traversal → 404 (not the repo package.json)
    const trav = await fetch(`${base}/preview/../../package.json`);
    assert.strictEqual(trav.status, 404, 'path traversal must be 404');

    // Unknown route → 404
    const unknown = await fetch(`${base}/api/nonexistent`);
    assert.strictEqual(unknown.status, 404, 'unknown route should be 404');
  } finally {
    server.close();
  }

  console.log('Workbench server contract: PASS');
})().catch((e) => {
  console.error(e.stack || e.message);
  process.exit(1);
});
