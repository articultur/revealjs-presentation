#!/usr/bin/env node
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');
const { spawnSync } = require('child_process');

const {
  loadDeckManifest,
  validateDeckManifest,
  writeDeckManifest,
  manifestToGeneratorInput,
} = require('../scripts/deck-manifest');
const { generate } = require('../scripts/generate-deck');
const registry = require('../references/layout-registry.json');

// Bound to a single manifest + output root for the process lifetime.
let manifestPath;
let outputRoot;
let cache = { manifest: null, etag: null };

function manifestEtag(manifest) {
  return `"${crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex')}"`;
}

function loadCurrent() {
  cache.manifest = loadDeckManifest(manifestPath);
  cache.etag = manifestEtag(cache.manifest);
  return cache.manifest;
}

function sendJson(res, status, body, extra = {}) {
  const headers = { 'content-type': 'application/json', ...extra };
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

function serveStatic(res, filePath, contentType) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': contentType });
  fs.createReadStream(filePath).pipe(res);
}

const putLock = { chain: Promise.resolve() };

function contentTypeFor(file) {
  const map = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
    '.webp': 'image/webp', '.gif': 'image/gif', '.json': 'application/json',
  };
  return map[path.extname(file).toLowerCase()] || 'application/octet-stream';
}

function safeResolve(rel) {
  const root = path.resolve(outputRoot);
  const resolved = path.resolve(root, rel);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => resolve(body));
  });
}

function handleRequest({ request, response }) {
  const url = new URL(request.url, 'http://127.0.0.1');
  const pathname = url.pathname;
  const method = request.method;

  if (pathname === '/api/manifest' && method === 'GET') {
    loadCurrent();
    return sendJson(response, 200, cache.manifest, { etag: cache.etag });
  }

  if (pathname === '/api/manifest' && method === 'PUT') {
    const ifMatch = request.headers['if-match'];
    if (!ifMatch) return sendJson(response, 428, { error: 'If-Match required' });
    // 序列化整个 PUT(check+read+write),防 TOCTOU:两并发 PUT 同 etag 时,第二个在第一个 write 后 check → 409
    const run = putLock.chain.then(() => new Promise((resolve) => {
      loadCurrent();
      if (ifMatch !== cache.etag) { sendJson(response, 409, { error: 'stale manifest — reload' }); return resolve(); }
      readBody(request).then((body) => {
        let parsed;
        try { parsed = JSON.parse(body); } catch (e) { sendJson(response, 400, { error: 'invalid json' }); return resolve(); }
        const v = validateDeckManifest(parsed);
        if (!v.ok) { sendJson(response, 422, { errors: v.errors }); return resolve(); }
        try {
          writeDeckManifest(manifestPath, parsed);
        } catch (e) {
          sendJson(response, 422, { errors: [e.message] }); return resolve();
        }
        loadCurrent();
        sendJson(response, 200, cache.manifest, { etag: cache.etag });
        resolve();
      });
    }));
    putLock.chain = run.catch(() => {});
    return;
  }

  if (pathname === '/api/render' && method === 'POST') {
    loadCurrent();
    try {
      const input = manifestToGeneratorInput(cache.manifest);
      const result = generate(input);
      const htmlRel = cache.manifest.output.html;
      const htmlAbs = safeResolve(htmlRel);
      if (!htmlAbs) throw new Error('output html path escapes root');
      fs.mkdirSync(path.dirname(htmlAbs), { recursive: true });
      fs.writeFileSync(htmlAbs, result.html);
      return sendJson(response, 200, { ok: true, html: htmlRel });
    } catch (e) {
      return sendJson(response, 500, { error: e.message });
    }
  }

  if (pathname === '/api/qa' && method === 'POST') {
    loadCurrent();
    const htmlAbs = safeResolve(cache.manifest.output.html);
    if (!htmlAbs) return sendJson(response, 400, { error: 'output path escapes root' });
    const r = spawnSync('node', [path.join(__dirname, '..', 'scripts', 'qa.js'), htmlAbs, '--no-visual'], { encoding: 'utf8', timeout: 420000 });
    return sendJson(response, r.status === 0 ? 200 : 500, {
      ok: r.status === 0,
      detail: (r.stdout || r.stderr || '').slice(-800),
    });
  }

  if (pathname === '/api/export/pptx' && method === 'POST') {
    loadCurrent();
    const htmlAbs = safeResolve(cache.manifest.output.html);
    const pptxRel = cache.manifest.output.pptx || cache.manifest.output.html.replace(/\.html$/, '.pptx');
    const pptxAbs = safeResolve(pptxRel);
    if (!htmlAbs || !pptxAbs) return sendJson(response, 400, { error: 'output path escapes root' });
    fs.mkdirSync(path.dirname(pptxAbs), { recursive: true });
    const r = spawnSync('node', [path.join(__dirname, '..', 'scripts', 'export-pptx.js'), htmlAbs, '-o', pptxAbs], { encoding: 'utf8', timeout: 420000 });
    return sendJson(response, r.status === 0 ? 200 : 500, { ok: r.status === 0, pptx: pptxRel });
  }

  if (pathname === '/api/registry' && method === 'GET') {
    return sendJson(response, 200, registry);
  }

  if (pathname === '/api/run' && method === 'GET') {
    const runPath = path.join(outputRoot, 'run.json');
    if (!fs.existsSync(runPath)) return sendJson(response, 404, { error: 'no run manifest yet' });
    return sendJson(response, 200, JSON.parse(fs.readFileSync(runPath, 'utf8')));
  }

  if (pathname.startsWith('/preview/')) {
    const rel = decodeURIComponent(pathname.slice('/preview/'.length));
    const abs = safeResolve(rel);
    if (!abs || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
      response.writeHead(404);
      response.end('not found');
      return;
    }
    response.writeHead(200, { 'content-type': contentTypeFor(abs) });
    fs.createReadStream(abs).pipe(response);
    return;
  }

  if (pathname === '/') return serveStatic(response, path.join(__dirname, 'index.html'), 'text/html; charset=utf-8');
  if (pathname === '/app.js') return serveStatic(response, path.join(__dirname, 'app.js'), 'application/javascript');
  if (pathname === '/styles.css') return serveStatic(response, path.join(__dirname, 'styles.css'), 'text/css');

  response.writeHead(404);
  response.end('not found');
}

async function createWorkbenchServer({ manifestPath: mp, outputRoot: or, port = 0 }) {
  manifestPath = path.resolve(mp);
  outputRoot = path.resolve(or);
  loadCurrent();
  const server = http.createServer((request, response) => handleRequest({ request, response }));
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return server;
}

module.exports = { createWorkbenchServer, manifestEtag };

if (require.main === module) {
  const args = process.argv.slice(2);
  let mp; let or; let port = 4173;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--manifest') mp = args[++i];
    else if (args[i] === '--out') or = args[++i];
    else if (args[i] === '--port') port = parseInt(args[++i], 10);
  }
  if (!mp || !or) {
    console.error('Usage: node workbench/server.js --manifest <m> --out <root> [--port 4173]');
    process.exit(2);
  }
  createWorkbenchServer({ manifestPath: mp, outputRoot: or, port })
    .then((s) => console.log(`workbench on http://127.0.0.1:${s.address().port}`))
    .catch((e) => { console.error(e.stack || e.message); process.exit(1); });
}
