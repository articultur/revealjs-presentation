#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const dns = require('dns');

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./, /^10\./, /^192\.168\./, /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^::1$/, /^fe80:/i, /^fc/i, /^fd/i, /^0\.0\.0\.0$/,
];

const MAX_BYTES = 20 * 1024 * 1024;

function isPrivateHost(host) {
  if (!host) return true;
  return PRIVATE_HOST_PATTERNS.some((re) => re.test(host));
}

function inferMime(source, fallback) {
  const ext = path.extname(source).toLowerCase();
  const map = {
    '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  };
  return map[ext] || fallback || 'application/octet-stream';
}

function extForMime(mime) {
  const map = {
    'image/svg+xml': '.svg', 'image/png': '.png', 'image/webp': '.webp',
    'image/gif': '.gif', 'image/jpeg': '.jpg',
  };
  return map[mime] || '.bin';
}

function storeBytes(bytes, outputDir, ext) {
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  const fileName = `${sha256.slice(0, 12)}${ext}`;
  const target = path.join(outputDir, 'assets', 'media', fileName);
  const relativePath = path.relative(outputDir, target);
  if (!fs.existsSync(target)) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
  }
  return { relativePath, sha256 };
}

function stageLocal(source, outputDir, allowRoot) {
  const srcAbs = path.resolve(source);
  const rootAbs = path.resolve(allowRoot);
  let srcReal;
  let rootReal;
  try {
    srcReal = fs.realpathSync(srcAbs);
    rootReal = fs.realpathSync(rootAbs);
  } catch (e) {
    throw new Error(`source outside allowRoot: ${source}`);
  }
  const inside = srcReal === rootReal || srcReal.startsWith(rootReal + path.sep);
  if (!inside) throw new Error(`source outside allowRoot: ${source}`);
  const bytes = fs.readFileSync(srcReal);
  const staged = storeBytes(bytes, outputDir, path.extname(srcReal) || '');
  return {
    source,
    relativePath: staged.relativePath,
    sha256: staged.sha256,
    bytes: bytes.length,
    mimeType: inferMime(srcReal),
  };
}

async function fetchRemote(urlString, maxRedirects) {
  let url;
  try { url = new URL(urlString); } catch (e) { throw new Error(`invalid url: ${urlString}`); }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error(`only http/https allowed: ${urlString}`);
  // 文本 hostname 检查(localhost / 字面私有 IP)
  if (isPrivateHost(url.hostname)) throw new Error(`private network rejected: ${url.hostname}`);
  // DNS 解析防 rebinding:resolved IP 不得私有;连接 pin 到已检查的 IP(不重新解析)
  const ips = await new Promise((resolve, reject) => {
    dns.lookup(url.hostname, { all: true }, (e, addrs) => (e ? reject(new Error(`DNS unresolved: ${url.hostname}`)) : resolve(addrs)));
  });
  if (!ips.length) throw new Error(`DNS unresolved: ${url.hostname}`);
  if (ips.some((ip) => isPrivateHost(ip.address))) {
    throw new Error(`private network rejected (DNS ${ips[0].address}): ${url.hostname}`);
  }
  const pinnedIp = ips[0].address;
  return new Promise((resolve, reject) => {
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.get(url, {
      timeout: 30000,
      lookup: (host, opts, cb) => cb(null, pinnedIp, 4),
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && maxRedirects > 0) {
        const next = new URL(res.headers.location, url).toString();
        res.resume();
        fetchRemote(next, maxRedirects - 1).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`http ${res.statusCode}: ${urlString}`));
        return;
      }
      const chunks = [];
      let size = 0;
      let aborted = false;
      res.on('data', (chunk) => {
        if (aborted) return;
        size += chunk.length;
        if (size > MAX_BYTES) {
          aborted = true;
          res.destroy();
          reject(new Error('body exceeds 20MB'));
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', () => {
        if (aborted) return;
        const mimeType = (res.headers['content-type'] || '').split(';')[0].trim();
        resolve({ bytes: Buffer.concat(chunks), mimeType, finalUrl: url.toString() });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
  });
}

async function stageRemote(source, outputDir) {
  const { bytes, mimeType, finalUrl } = await fetchRemote(source, 3);
  if (!/^image\//.test(mimeType)) throw new Error(`non-image MIME rejected: ${mimeType}`);
  const staged = storeBytes(bytes, outputDir, extForMime(mimeType));
  return {
    source,
    relativePath: staged.relativePath,
    sha256: staged.sha256,
    bytes: bytes.length,
    mimeType,
    finalUrl,
  };
}

async function stageMedia({ source, outputDir, allowRoot }) {
  if (!source || !outputDir) throw new Error('source and outputDir are required');
  if (/^https?:\/\//i.test(source)) return stageRemote(source, outputDir);
  if (!allowRoot) throw new Error('allowRoot is required for local sources');
  return stageLocal(source, outputDir, allowRoot);
}

async function stageManifestMedia({ manifest, manifestPath, outputDir, allowRoot }) {
  const out = JSON.parse(JSON.stringify(manifest));
  const manifestDir = path.dirname(path.resolve(manifestPath));
  const root = allowRoot || manifestDir;
  for (const slide of out.slides) {
    if (!Array.isArray(slide.mediaSlots)) continue;
    for (const slot of slide.mediaSlots) {
      if (slot && slot.source && !slot.sha256) {
        try {
          // Resolve relative sources against the manifest directory (a manifest's media references
          // are relative to the manifest, like an HTML document's src) — not the process CWD, which
          // would put them outside allowRoot and make portable fixtures fail to stage.
          let src = slot.source;
          if (!/^https?:\/\//i.test(src) && !path.isAbsolute(src)) {
            src = path.resolve(manifestDir, src);
          }
          const staged = await stageMedia({ source: src, outputDir, allowRoot: root });
          slot.source = staged.relativePath;
          slot.sha256 = staged.sha256;
          slot.mimeType = staged.mimeType;
          slot.bytes = staged.bytes;
          if (staged.finalUrl) slot.originalUrl = staged.finalUrl;
        } catch (e) {
          throw new Error(`media staging failed for slot ${slot.slotId || slot.source}: ${e.message}`);
        }
      }
    }
  }
  return out;
}

module.exports = { stageMedia, stageManifestMedia, isPrivateHost, inferMime, fetchRemote };
