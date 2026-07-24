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
    loadCurrent();
    if (ifMatch !== cache.etag) return sendJson(response, 409, { error: 'stale manifest — reload' });
    readBody(request).then((body) => {
      let parsed;
      try { parsed = JSON.parse(body); } catch (e) { return sendJson(response, 400, { error: 'invalid json' }); }
      const v = validateDeckManifest(parsed);
      if (!v.ok) return sendJson(response, 422, { errors: v.errors });
      try {
        writeDeckManifest(manifestPath, parsed);
      } catch (e) {
        return sendJson(response, 422, { errors: [e.message] });
      }
      loadCurrent();
      return sendJson(response, 200, cache.manifest, { etag: cache.etag });
    });
    return;
  }

  if (pathname === '/api/render' && method === 'POST') {
    loadCurrent();
    try {
      const input = manifestToGeneratorInput(cache.manifest);
      const result = generate(input);
      const htmlRel = cache.manifest.output.html;
      const htmlAbs = path.join(outputRoot, htmlRel);
      fs.mkdirSync(path.dirname(htmlAbs), { recursive: true });
      fs.writeFileSync(htmlAbs, result.html);
      return sendJson(response, 200, { ok: true, html: htmlRel });
    } catch (e) {
      return sendJson(response, 500, { error: e.message });
    }
  }

  if (pathname === '/api/qa' && method === 'POST') {
    loadCurrent();
    const htmlAbs = path.join(outputRoot, cache.manifest.output.html);
    const r = spawnSync('node', [path.join(__dirname, '..', 'scripts', 'qa.js'), htmlAbs, '--no-visual'], { encoding: 'utf8' });
    return sendJson(response, r.status === 0 ? 200 : 500, {
      ok: r.status === 0,
      detail: (r.stdout || r.stderr || '').slice(-800),
    });
  }

  if (pathname === '/api/export/pptx' && method === 'POST') {
    loadCurrent();
    const htmlAbs = path.join(outputRoot, cache.manifest.output.html);
    const pptxRel = cache.manifest.output.pptx || cache.manifest.output.html.replace(/\.html$/, '.pptx');
    const pptxAbs = path.join(outputRoot, pptxRel);
    fs.mkdirSync(path.dirname(pptxAbs), { recursive: true });
    const r = spawnSync('node', [path.join(__dirname, '..', 'scripts', 'export-pptx.js'), htmlAbs, '-o', pptxAbs], { encoding: 'utf8' });
    return sendJson(response, r.status === 0 ? 200 : 500, { ok: r.status === 0, pptx: pptxRel });
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
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
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
