#!/usr/bin/env node
'use strict';

/**
 * Fetch Assets · Openverse API(无 key 800M 聚合)+ 分级 + 限流兜底
 * ------------------------------------------------------------
 * 组件 3「素材获取」——spec 三期:Openverse 无 key 主源 + Wikimedia + 分级策略。
 *
 * 分级(spec Round 2 + 调研):
 *   主源 = Openverse(800M 聚合 80+ 源,无 key)+ Wikimedia Commons(100M,无 key,见 image-driven-deck.md)
 *   备源 = Unsplash/Pexels(需 key,可选配置,本脚本不强依赖)
 *   不够高清 → 占位(Picsum)+ 标注"换官方照"→ 用户手动换
 *   明星/特定人物:CC-BY 天花板(库不收),占位 + 用户换(BP 教训:Wikimedia 限流低清)
 *
 * 限流兜底(三道):
 *   1. 本地缓存(.cache/assets/<hash>.json,7 天 TTL)
 *   2. 指数退避重试(3 次:1s/2s/4s,429/超时触发)
 *   3. 占位降级(全失败 → Picsum,标注"换官方照")
 *
 * Usage:
 *   node scripts/fetch-assets.js --query "Hangzhou West Lake" --limit 5
 *   node scripts/fetch-assets.js --query "..." --license cc-by --cache .cache/assets
 *   node scripts/fetch-assets.js --query "..." --json     # JSON 输出(供 skill 消费)
 *   node scripts/fetch-assets.js --query "..." --no-fallback   # 失败不降级(测试用)
 *
 * Exit codes:
 *   0 成功(Openverse 命中 或 缓存命中)
 *   1 全失败降级到 Picsum 占位(仍输出,标注"换官方照")
 *   2 usage error
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const args = process.argv.slice(2);
function flag(name) {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : null;
}
const query = flag('query');
const limit = Math.max(1, parseInt(flag('limit') || '5', 10));
const license = flag('license') || 'cc-by,cc-by-sa,cc0';   // CC-BY 优先
const cacheDir = flag('cache') || '.cache/assets';
const jsonOut = args.includes('--json');
const noFallback = args.includes('--no-fallback');

if (!query) {
  console.error('用法: node scripts/fetch-assets.js --query "..." [--limit 5] [--license cc-by] [--cache .cache/assets] [--json] [--no-fallback]');
  process.exit(2);
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;   // 7 天
fs.mkdirSync(cacheDir, { recursive: true });
const cacheKey = crypto.createHash('sha1').update(`${query}|${license}|${limit}`).digest('hex').slice(0, 16);
const cacheFile = path.join(cacheDir, `${cacheKey}.json`);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 1. 缓存命中?
if (fs.existsSync(cacheFile)) {
  const stat = fs.statSync(cacheFile);
  if (Date.now() - stat.mtimeMs < CACHE_TTL_MS) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (cached.results && cached.results.length) {
        output({ results: cached.results }, 'cache-hit(' + Math.round((Date.now() - stat.mtimeMs) / 86400000) + 'd)');
        process.exit(0);
      }
    } catch (_) { /* 缓存损坏,继续在线 fetch */ }
  }
}

// 2. Openverse API(无 key,800M 聚合)
async function fetchOpenverse(q, retries = 3) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=${limit}&license=${license}&mature=false&size=large`;
  let lastErr;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'revealjs-presentation-skill/1.0 (educational deck building)' },
        signal: AbortSignal.timeout(15000),
      });
      if (res.status === 429) {                                  // 限流 → 指数退避
        await sleep(1000 * Math.pow(2, attempt));
        continue;
      }
      if (!res.ok) throw new Error(`Openverse HTTP ${res.status}`);
      const data = await res.json();
      if (!data.results || !data.results.length) {
        throw new Error('Openverse 返回 0 结果(主题可能太窄或明星/特定人物)');
      }
      return data.results.slice(0, limit).map(r => ({
        url: r.url,
        thumb: r.thumbnail,
        license: `${r.license}${r.license_version ? ' ' + r.license_version : ''}`,
        source: r.source,
        creator: r.creator || '',
        creatorUrl: r.creator_url || '',
        detail: r.detail || '',
      }));
    } catch (e) {
      lastErr = e;
      if (attempt < retries - 1) {
        await sleep(1000 * Math.pow(2, attempt));               // 指数退避
      }
    }
  }
  throw lastErr || new Error('Openverse 重试耗尽');
}

// 2b. Wikimedia Commons(无 key,100M CC-BY/CC0/PDM)——Openverse 聚合的补强
async function fetchWikimedia(q, retries = 3) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=1280&format=json`;
  let lastErr;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'revealjs-presentation-skill/1.0 (educational deck building)' },
        signal: AbortSignal.timeout(15000),
      });
      if (res.status === 429) {                                  // 限流 → 指数退避
        await sleep(1000 * Math.pow(2, attempt));
        continue;
      }
      if (!res.ok) throw new Error(`Wikimedia HTTP ${res.status}`);
      const data = await res.json();
      const pages = (data.query && data.query.pages) || {};
      const out = Object.values(pages).map(p => {
        const ii = (p.imageinfo || [])[0];
        if (!ii) return null;
        const lic = (ii.extmetadata && ii.extmetadata.LicenseShortName && ii.extmetadata.LicenseShortName.value) || 'unknown';
        return {
          url: ii.url,
          thumb: ii.thumburl || ii.url,
          license: lic.replace(/<[^>]+>/g, '').trim(),
          source: 'wikimedia',
          creator: ((ii.extmetadata && ii.extmetadata.Artist && ii.extmetadata.Artist.value) || '').replace(/<[^>]+>/g, '').trim(),
          creatorUrl: '',
          detail: ii.descriptionurl || '',
        };
      }).filter(Boolean);
      if (!out.length) throw new Error('Wikimedia 0 结果');
      return out;
    } catch (e) {
      lastErr = e;
      if (attempt < retries - 1) await sleep(1000 * Math.pow(2, attempt));
    }
  }
  throw lastErr || new Error('Wikimedia 重试耗尽');
}

// 3. 占位降级(Picsum 无 key 随机图)
function picsumFallback(q, n) {
  const seed = crypto.createHash('sha1').update(q).digest('hex').slice(0, 8);
  return Array.from({ length: n }, (_, i) => ({
    url: `https://picsum.photos/seed/${seed}${i}/1280/720`,
    thumb: `https://picsum.photos/seed/${seed}${i}/400/225`,
    license: 'placeholder(占位,必须换官方照)',
    source: 'Picsum(降级)',
    creator: '', creatorUrl: '', detail: '',
    note: 'Openverse 限流/0 结果/超时——占位图,必须换主题真实素材。明星/特定人物 CC-BY 天花板,用户手动换',
  }));
}

function output(data, source) {
  const result = { query, license, limit, source, resultCount: data.results.length, results: data.results };
  if (jsonOut) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(`fetch-assets: ${data.results.length} results(${source})`);
  console.log(`  query: ${query}`);
  console.log(`  license: ${license}`);
  data.results.forEach((r, i) => {
    console.log(`  [${i + 1}] ${r.url}`);
    console.log(`      ${r.license} · ${r.source}${r.creator ? ' · ' + r.creator : ''}`);
  });
  if (data.results.some(r => r.note)) {
    console.log('  ⚠ 含占位图——必须换主题真实素材(CC-BY 天花板:明星/特定人物)');
  }
}

(async () => {
  let results;
  let source;
  // 并发查双源(任一成功即用;Openverse 聚合更广优先,Wikimedia 补强去重)
  const [ov, wm] = await Promise.allSettled([fetchOpenverse(query), fetchWikimedia(query)]);
  if (ov.status === 'fulfilled') {
    results = ov.value;
    source = 'openverse';
    if (wm.status === 'fulfilled' && wm.value.length) {
      const ovUrls = new Set(results.map(r => r.url));
      wm.value.forEach(r => { if (!ovUrls.has(r.url)) results.push(r); });
      source = 'openverse+wikimedia';
    }
  } else if (wm.status === 'fulfilled') {
    results = wm.value;
    source = 'wikimedia';
  } else {
    // 双源全失败 → 占位降级
    if (noFallback) {
      console.error(`fetch-assets failed(无降级): Openverse(${ov.reason.message}) / Wikimedia(${wm.reason.message})`);
      process.exit(1);
    }
    console.error(`fetch-assets: 双源失败(Openverse ${ov.reason.message}; Wikimedia ${wm.reason.message})→ 降级 Picsum 占位`);
    results = picsumFallback(query, limit);
    source = 'picsum-fallback';
  }
  results = results.slice(0, limit);  // 双源合并去重可能超 limit,截断遵守 --limit 契约(review I4)
  if (source !== 'picsum-fallback') {
    fs.writeFileSync(cacheFile, JSON.stringify({ query, license, limit, results, cachedAt: new Date().toISOString() }, null, 2));
  }
  output({ results }, source);
  process.exit(source === 'openverse' || source === 'wikimedia' || source === 'openverse+wikimedia' || source.startsWith('cache-hit') ? 0 : 1);
})();
