#!/usr/bin/env node
'use strict';
/* eslint-disable */

/**
 * generate-archetype-deck.js — 端到端:内容 → archetype 路由 → deck.html
 * ====================================================================
 * 完整实现 ② 内容路由层的"最后一公里":把 content-router 的路由结果
 * (archetype + variant)落成真实可渲染的单文件 deck.html。
 *
 * 全链路(四层架构闭合):
 *   结构化内容 → content-router 路由(②) → A1-A12 archetype 骨架(①)
 *   → 套 token(③,内联) → deck.html → lint/visual-verdict 校验(④)
 *
 * 实验性生成器(非交付模板):证明"内容不在 9 template 覆盖也能靠
 * archetype 组合生成高质量 deck"。产物放 output/(gitignore),不进 examples/。
 *
 * 用法:
 *   node scripts/generate-archetype-deck.js --demo [out.html]
 *   node scripts/generate-archetype-deck.js input.json [out.html]
 */

const fs = require('fs');
const path = require('path');
const { routeDeck } = require('./content-router');

const ROOT = path.resolve(__dirname, '..');
const TOKENS_DIR = path.join(ROOT, 'tokens');

// voice → Google Fonts URL(editorial-serif 为默认)
const VOICE_FONTS = {
  'editorial-serif': 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Source+Serif+4:opsz,wght@8..60,400&family=Noto+Serif+SC:wght@400;600&family=Noto+Sans+SC:wght@400&family=Courier+Prime:wght@400&display=swap',
};
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function readTokensInline(voice) {
  const base = fs.readFileSync(path.join(TOKENS_DIR, 'base.css'), 'utf8');
  let prim = '';
  try { prim = fs.readFileSync(path.join(TOKENS_DIR, `${voice}.css`), 'utf8'); } catch (e) { /* voice 无 token 文件则只用 base */ }
  return base + '\n' + prim;
}

// ── 12 archetype fill(对齐 references/layout-archetypes.md 骨架,token 化)──
function fillArchetype(route, s, idx, total) {
  const num = String(idx + 1).padStart(2, '0');
  const v = route.variant_hint ? `<!-- variant:${esc(route.variant_hint)} -->` : '';
  const wrap = (inner, cls = 'deck-flex', style = 'height:100%;') =>
    `<section class="${cls}" data-background="var(--c-bg)" style="${style}">${v}${inner}<div class="pin">${num} / ${esc(route.content_type)}</div></section>`;

  switch (route.archetype) {
    // A1 Masthead Cover
    case 'A1': return wrap(`<div style="padding:1.1em 2.4em 0.6em;">
      <div style="border-top:3px double var(--c-fg);border-bottom:1px solid var(--c-fg);padding:0.5em 0 0.35em;display:flex;justify-content:space-between;font-family:var(--f-mono);font-size:0.52em;letter-spacing:0.16em;text-transform:uppercase;color:var(--c-fg-2);">
        ${(s.meta || ['VOL. 01', '2026', 'REPORT']).map(m => `<span>${esc(m)}</span>`).join('')}
      </div>
      <div style="font-family:var(--f-display);font-size:clamp(2.4em,4.6em,5.6em);font-weight:600;font-style:italic;line-height:1;color:var(--c-fg);margin-top:0.26em;">${esc(s.title)}</div>
      ${s.subtitle ? `<div style="font-family:var(--f-mono);font-size:0.68em;letter-spacing:0.28em;color:var(--c-accent);margin-top:0.35em;text-transform:uppercase;">${esc(s.subtitle)}</div>` : ''}
    </div>
    <div style="height:4px;background:var(--c-fg);"></div>
    <div style="padding:1em 2.4em;display:flex;gap:2em;flex:1;align-items:flex-start;">
      <div style="flex:1.5;font-family:var(--f-display);font-size:1.3em;font-style:italic;line-height:1.32;color:var(--c-fg-2);">${esc(s.body || '')}</div>
      <div style="flex:1;border-left:1px solid var(--c-border);padding-left:1.4em;">
        <div style="font-family:var(--f-mono);font-size:0.52em;letter-spacing:0.12em;text-transform:uppercase;color:var(--c-fg-2);margin-bottom:0.5em;">关键事实</div>
        ${(s.facts || []).map(f => `<div style="font-size:0.68em;margin:0.28em 0;color:var(--c-fg-2);"><b style="color:var(--c-fg);font-family:var(--f-mono);">${esc(f.k)}</b> ${esc(f.v)}</div>`).join('')}
      </div>
    </div>`, 'deck-flex', 'flex-direction:column;padding:0;height:100%;');

    // A2 Manifesto Statement
    case 'A2': return wrap(`<div class="kicker">${esc(s.title || '命题')}</div>
      <h1 style="margin:0.4em 0 0;font-family:var(--f-display);font-size:clamp(2.4em,3.6em,4.4em);font-weight:500;line-height:1.12;color:var(--c-fg);">
        ${s.emphasis ? `<em style="color:var(--c-accent);">${esc(s.emphasis)}</em>` : ''}${esc(s.body || '')}
      </h1>
      <div style="height:1px;background:var(--c-border);margin:1.1em 0;"></div>
      <p style="font-size:0.9em;max-width:50ch;color:var(--c-fg-2);">${esc(s.support || '')}</p>`, 'deck-flex', 'flex-direction:column;justify-content:center;padding:0 5em;height:100%;');

    // A3 Register Axis
    case 'A3': return wrap(`<div class="kicker">${esc(s.title || '编年')}</div>
      <h2 style="font-family:var(--f-display);font-size:1.8em;margin:0.3em 0 0.4em;">${esc(s.subtitle || s.title || '')}</h2>
      <div style="position:relative;margin-top:2.2em;padding-top:1.4em;border-top:2px solid var(--c-fg);">
        <div style="display:grid;grid-template-columns:repeat(${Math.min((s.nodes||[]).length,6)},1fr);gap:14px;">
          ${(s.nodes || []).map(n => `<div style="position:relative;padding-top:1.4em;">
            <div style="position:absolute;top:-1.85em;left:0;width:9px;height:9px;border-radius:50%;background:${n.accent ? 'var(--c-accent)' : 'var(--c-fg-3)'};"></div>
            <div style="font-family:var(--f-display);font-style:italic;font-size:1.5em;line-height:1;color:${n.accent ? 'var(--c-accent)' : 'var(--c-fg)'};">${esc(n.year)}</div>
            <h4 style="font-size:0.78em;margin:0.35em 0 0.2em;">${esc(n.title)}</h4>
            <p style="font-size:0.56em;color:var(--c-fg-2);">${esc(n.desc||'')}</p>
          </div>`).join('')}
        </div>
      </div>`, 'deck-flex', 'flex-direction:column;padding:2.6em 3em;height:100%;');

    // A4 Full-Bleed Split
    case 'A4': return `<section class="deck-flex" data-background="var(--c-bg)" style="height:100%;padding:0;">${v}
      <div style="width:42%;background:var(--c-fg);color:var(--c-bg);display:flex;flex-direction:column;justify-content:space-between;padding:2.2em 2em;">
        <div><div class="kicker" style="color:var(--c-accent);">${esc(s.title)}</div>
        <h2 style="color:var(--c-bg);margin:0.5em 0 0;">${esc(s.panel_title||s.title)}</h2></div>
        <div style="font-family:var(--f-display);font-style:italic;color:var(--c-bg);font-size:1.1em;">${esc(s.panel_quote||'')}</div>
      </div>
      <div style="width:58%;display:flex;flex-direction:column;justify-content:center;padding:2.2em 2.6em;">${esc(s.body||'')}</div>
      <div class="pin" style="color:rgba(240,233,216,0.6);">${num} / ${esc(route.content_type)}</div></section>`;

    // A5 Anchor Numeral(variant:显著数据放大)
    case 'A5': return wrap(`<div style="display:flex;gap:3em;align-items:flex-start;width:100%;">
      <div style="flex:1;">
        <div class="kpi-label" style="color:var(--c-fg-3);font-family:var(--f-mono);font-size:0.5em;letter-spacing:0.16em;text-transform:uppercase;">${esc(s.label||'')}</div>
        <div style="font-family:var(--f-display);font-size:${route.variant_hint ? 'clamp(4em,5.6em,6.4em)' : 'clamp(3.6em,5em,5.6em)'};font-weight:600;font-style:italic;line-height:1;margin:0.15em 0;color:var(--c-accent);">${esc(s.number||'')}</div>
        <div style="font-family:var(--f-display);font-style:italic;font-size:1.2em;margin-top:0.4em;">${esc(s.event||s.title||'')}</div>
        <p style="font-size:0.78em;margin-top:0.5em;color:var(--c-fg-2);">${esc(s.note||'')}</p>
        <div style="font-family:var(--f-mono);font-size:0.5em;color:var(--c-fg-3);margin-top:0.6em;letter-spacing:0.1em;text-transform:uppercase;">${esc(s.source||'')}</div>
      </div>
      <div style="flex:1.1;border-left:1px solid var(--c-border);padding-left:2em;">
        <div class="kpi-label" style="font-family:var(--f-mono);font-size:0.5em;letter-spacing:0.16em;text-transform:uppercase;color:var(--c-fg-2);">证据</div>
        ${(s.evidence || []).map(e => `<div style="display:flex;justify-content:space-between;padding:0.4em 0;border-bottom:1px solid var(--c-rule);font-size:0.7em;"><span style="color:var(--c-fg-2);">${esc(e.k)}</span><b style="font-family:var(--f-mono);color:var(--c-fg);">${esc(e.v)}</b></div>`).join('')}
      </div></div>`, 'deck-flex', 'align-items:center;padding:2.6em 3.2em;height:100%;');

    // A6 Face-Off Compare
    case 'A6': return `<section class="deck-flex" data-background="var(--c-bg)" style="height:100%;padding:0;">${v}
      <div style="width:52%;background:var(--c-accent);color:var(--c-bg);display:flex;flex-direction:column;justify-content:space-between;padding:1.9em 2.4em;">
        <div><div style="font-family:var(--f-mono);font-size:0.5em;letter-spacing:0.16em;text-transform:uppercase;color:var(--c-bg);opacity:0.8;">${esc(s.a_label||'A')}</div>
        <div style="font-family:var(--f-display);font-size:clamp(3.4em,4.6em,5.2em);font-style:italic;font-weight:600;color:var(--c-bg);line-height:1;">${esc(s.a_value||'')}</div>
        <div style="font-family:var(--f-mono);font-size:0.5em;opacity:0.8;color:var(--c-bg);">${esc(s.a_unit||'')}</div></div>
        ${(s.a_details||[]).map(d=>`<div style="font-size:0.62em;color:var(--c-bg);opacity:0.92;border-top:1px solid rgba(255,255,255,0.2);padding-top:0.3em;margin-top:0.3em;">${esc(d)}</div>`).join('')}
      </div>
      <div style="width:48%;display:flex;flex-direction:column;justify-content:center;padding:2.2em 2.5em;">
        <div style="font-family:var(--f-mono);font-size:0.5em;letter-spacing:0.16em;text-transform:uppercase;color:var(--c-fg-2);">${esc(s.b_label||'B')}</div>
        <div style="font-family:var(--f-display);font-size:clamp(2.8em,3.4em,4em);font-style:italic;font-weight:600;color:var(--c-fg);line-height:1;">${esc(s.b_value||'')}</div>
        <div style="font-family:var(--f-mono);font-size:0.5em;color:var(--c-fg-2);">${esc(s.b_unit||'')}</div>
        ${(s.b_details||[]).map(d=>`<div style="font-size:0.62em;color:var(--c-fg-2);border-top:1px solid var(--c-rule);padding-top:0.3em;margin-top:0.3em;">${esc(d)}</div>`).join('')}
        <div style="height:1px;background:var(--c-fg);margin:1.2em 0 0.8em;"></div>
        <div style="font-family:var(--f-display);font-style:italic;font-size:2.7em;color:var(--c-accent);line-height:1;">${esc(s.verdict||'')}</div>
        <div style="font-family:var(--f-mono);font-size:0.5em;color:var(--c-fg-2);letter-spacing:0.12em;text-transform:uppercase;">${esc(s.verdict_note||'')}</div>
      </div><div class="pin">${num} / ${esc(route.content_type)}</div></section>`;

    // A7 KPI Grid
    case 'A7': return wrap(`<div class="kicker">${esc(s.title||'指标')}</div>
      <div style="display:grid;grid-template-columns:repeat(${Math.min((s.kpis||[]).length,4)},1fr);gap:1.1em;margin-top:1.4em;">
        ${(s.kpis||[]).map((k,i)=>`<div style="border:1px solid var(--c-fg);background:${i===0?'var(--c-fg)':'var(--c-bg-paper)'};color:${i===0?'var(--c-bg)':'var(--c-fg)'};padding:1.1em 1em;">
          <div style="font-family:var(--f-mono);font-size:0.48em;letter-spacing:0.12em;text-transform:uppercase;opacity:0.8;">${esc(k.label)}</div>
          <div style="font-family:var(--f-display);font-style:italic;font-weight:600;font-size:2.6em;line-height:0.95;color:${i===0?'var(--c-bg)':'var(--c-accent)'};margin-top:0.15em;">${esc(k.value)}</div>
          <div style="font-size:0.58em;opacity:0.75;margin-top:0.2em;">${esc(k.note||'')}</div></div>`).join('')}
      </div>`, 'deck-flex', 'flex-direction:column;justify-content:center;padding:2.6em 3em;height:100%;');

    // A8 Mechanism
    case 'A8': return wrap(`<div class="kicker">${esc(s.title||'机制')}</div>
      <h2 style="font-family:var(--f-display);font-size:1.8em;margin:0.3em 0 1em;">${esc(s.subtitle||s.title||'')}</h2>
      <div style="display:flex;gap:1.2em;align-items:stretch;">
        <div style="flex:1;border:1px solid var(--c-border);padding:1em;">
          <div style="font-family:var(--f-mono);font-size:0.48em;letter-spacing:0.12em;text-transform:uppercase;color:var(--c-fg-3);">${esc(s.before_label||'前')}</div>
          ${(s.before_items||[]).map((it,i)=>`<div style="height:0.9em;background:var(--c-fg);opacity:${0.85-i*0.13};margin:0.4em 0;"></div>`).join('')}
        </div>
        <div style="display:flex;align-items:center;font-size:2em;color:var(--c-accent);font-family:var(--f-display);font-style:italic;">→</div>
        <div style="flex:1;border:2px solid var(--c-accent);background:var(--c-accent);color:var(--c-bg);padding:1em;">
          <div style="font-family:var(--f-mono);font-size:0.48em;letter-spacing:0.12em;text-transform:uppercase;opacity:0.85;">${esc(s.after_label||'后')}</div>
          ${(s.after_items||[]).map(it=>`<div style="height:0.6em;background:var(--c-bg);opacity:0.85;margin:0.4em 0;"></div>`).join('')}
          <div style="font-family:var(--f-mono);font-size:0.5em;margin-top:0.6em;">${esc(s.reduction||'')}</div>
        </div>
      </div>`, 'deck-flex', 'flex-direction:column;justify-content:center;padding:2.6em 3em;height:100%;');

    // A9 Evidence Table
    case 'A9': return wrap(`<div class="kicker">${esc(s.title||'台账')}</div>
      <h2 style="font-family:var(--f-display);font-size:1.6em;margin:0.3em 0 0.8em;">${esc(s.subtitle||s.title||'')}</h2>
      <table style="width:100%;border-collapse:collapse;font-family:var(--f-body);font-size:0.66em;">
        <thead><tr>${(s.headers||[]).map((h,i)=>`<th style="text-align:${i===0?'left':'right'};padding:0.5em;font-family:var(--f-mono);font-size:0.85em;letter-spacing:0.12em;text-transform:uppercase;color:${i===s.highlight_col?'var(--c-accent)':'var(--c-fg-3)'};border-bottom:2px solid var(--c-fg);">${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${(s.rows||[]).map(r=>`<tr>${r.map((c,i)=>`<td style="padding:0.55em 0.5em;border-bottom:1px solid var(--c-rule);text-align:${i===0?'left':'right'};color:${i===s.highlight_col?'var(--c-accent)':'var(--c-fg-2)'};font-weight:${i===s.highlight_col?600:400};${i>0?'font-family:var(--f-mono);':''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>`, 'deck-flex', 'flex-direction:column;padding:2.6em 3em;height:100%;');

    // A10 Pullquote
    case 'A10': return `<section class="deck-grid" data-background="var(--c-bg)" style="grid-template-columns:0.3fr 0.7fr;gap:64px;align-items:center;padding:64px 80px;height:100%;">${v}
      <div style="border-right:1px solid var(--c-border);padding-right:56px;">
        <div style="font-family:var(--f-display);font-style:italic;font-size:4em;color:var(--c-accent);line-height:0.9;">№ ${esc(s.number||'')}</div>
        <div style="font-family:var(--f-mono);font-size:0.5em;letter-spacing:0.12em;text-transform:uppercase;color:var(--c-fg-2);margin-top:0.6em;">${esc(s.title||'引言')}</div>
        <div style="font-weight:600;font-size:0.85em;margin-top:0.4em;">${esc(s.who||'')}</div>
        <div style="font-family:var(--f-mono);font-size:0.5em;color:var(--c-fg-2);letter-spacing:0.08em;">${esc(s.role||'')}</div>
      </div>
      <div style="font-family:var(--f-display);font-style:italic;font-size:1.9em;line-height:1.32;color:var(--c-fg);">"${esc(s.quote||s.body||'')}"</div>
      <div class="pin" style="bottom:24px;">${num} / ${esc(route.content_type)}</div></section>`;

    // A11 Takeaway Roster
    case 'A11': return wrap(`<div class="kicker">${esc(s.title||'要点')}</div>
      <h2 style="font-family:var(--f-display);font-size:1.8em;margin:0.3em 0 1em;">${esc(s.subtitle||s.title||'')}</h2>
      <div style="display:grid;grid-template-columns:repeat(${Math.min((s.items||[]).length,3)},1fr);gap:1.4em;">
        ${(s.items||[]).map((it,i)=>`<div style="border-top:3px solid var(--c-accent);padding:0.7em 0;">
          <div style="font-family:var(--f-display);font-style:italic;font-size:2.5em;color:var(--c-accent);line-height:1;">${['i','ii','iii','iv'][i]}.</div>
          <h3 style="font-size:1.1em;margin:0.4em 0 0.25em;">${esc(it.t)}</h3>
          <p style="font-size:0.64em;color:var(--c-fg-2);">${esc(it.d||'')}</p></div>`).join('')}
      </div>`, 'deck-flex', 'flex-direction:column;justify-content:center;padding:2.6em 3em;height:100%;');

    // A12 Masthead Closing
    case 'A12': return wrap(`<div style="text-align:center;">
        <div style="border-top:3px double var(--c-fg);border-bottom:1px solid var(--c-fg);padding:0.5em 0 0.35em;display:inline-block;font-family:var(--f-mono);font-size:0.52em;letter-spacing:0.16em;text-transform:uppercase;color:var(--c-fg-2);min-width:60%;">${esc(s.topic||'FIN')}</div>
        <h2 style="font-family:var(--f-display);font-style:italic;font-size:clamp(2.4em,3.6em,4.2em);font-weight:500;line-height:1.1;margin:0.5em 0;color:var(--c-fg);">${esc(s.title||'')}</h2>
        <p style="font-size:0.85em;max-width:50ch;margin:0.8em auto;color:var(--c-fg-2);font-style:italic;">${esc(s.body||'')}</p>
        <div style="margin-top:1.2em;display:inline-flex;gap:0.6em;"><span class="stamp" style="border:2px solid var(--c-accent);color:var(--c-accent);padding:0.35em 0.8em;font-family:var(--f-mono);font-size:0.5em;letter-spacing:0.22em;text-transform:uppercase;">${esc(s.stamp||'CATALOGUED')}</span></div>
      </div>`, 'deck-flex', 'flex-direction:column;justify-content:center;align-items:center;padding:2.6em 3em;height:100%;text-align:center;');

    default: return wrap(`<h2>${esc(s.title||'')}</h2><p>${esc(s.body||'')}</p>`);
  }
}

function assembleDeck(input, routed) {
  const voice = input.voice || 'editorial-serif';
  const tokens = readTokensInline(voice);
  const fonts = VOICE_FONTS[voice] || VOICE_FONTS['editorial-serif'];
  const sections = routed.routes.map((r, i) => fillArchetype(r, input.sections[i], i, routed.routes.length)).join('\n');
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(input.topic || 'Deck')}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/reveal.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${fonts}" rel="stylesheet">
<style>
${tokens}
.reveal{font-family:var(--f-body),'Arial Narrow',serif;font-size:28px;color:var(--c-fg);background:var(--c-bg);}
.reveal .slides{text-align:left;}
.reveal section{padding:2.6em 3em;height:100%;box-sizing:border-box;overflow:hidden;background:var(--c-bg);position:relative;}
.reveal section>*{max-width:100%;box-sizing:border-box;}
.reveal h1,.reveal h2,.reveal h3{font-family:var(--f-display);color:var(--c-fg);line-height:1.1;margin:0;}
.reveal p{margin:0;}
.kicker{font-family:var(--f-mono);font-size:0.5em;letter-spacing:0.16em;text-transform:uppercase;color:var(--c-fg-3);display:inline-block;}
.pin{position:absolute;left:2.5em;bottom:1.2em;font-family:var(--f-mono);font-size:0.46em;letter-spacing:0.08em;color:var(--c-fg-3);}
.deck-flex{display:flex !important;}
.deck-grid{display:grid !important;}
.reveal .progress{color:var(--c-accent);}
@media (prefers-reduced-motion:reduce){.reveal *{transition:none!important;animation:none!important;}}
</style>
</head>
<body>
<div class="reveal"><div class="slides">
${sections}
</div></div>
<script src="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/reveal.js"></script>
<script>
Reveal.initialize({width:1280,height:720,margin:0.04,hash:true,slideNumber:'c/t',progress:true,center:false,controls:true,controlsTutorial:false,transition:'fade',backgroundTransition:'fade'});
</script>
</body></html>`;
}

// ── 内置医疗 demo(结构化 sections,不在 9 template 覆盖)──
const MEDICAL = {
  topic: 'III 期临床试验结果 · CX-204',
  voice: 'editorial-serif',
  sections: [
    { title: 'III 期临床结果', subtitle: 'CX-204 · 晚期 NSCLC', meta: ['VOL. 01', '2026', 'CLINICAL READOUT'],
      body: 'CX-204 将晚期 NSCLC 患者 5 年总生存率从 42% 提升到 67%,达到主要终点。',
      facts: [{ k: 'OS', v: '67% vs 42%' }, { k: 'PFS', v: '中位 14.2 月' }, { k: 'N', v: 'n=480' }, { k: '期', v: 'III 期' }] },
    { title: '核心结论', emphasis: '67%', body: ' —— 5 年生存率的全新基准。', support: 'III 期试验 n=480,主要终点 OS 达到,HR=0.52,p<0.001。' },
    { title: '主要终点', label: 'PRIMARY ENDPOINT · OS', number: '67%', event: 'CX-204 试验组 5 年生存率',
      note: 'vs 对照组 42% · HR=0.52(95%CI 0.42-0.64) · p<0.001', source: 'III 期 · 主要终点 · verified',
      evidence: [{ k: '对照组 OS', v: '42%' }, { k: 'HR (95%CI)', v: '0.52 (0.42-0.64)' }, { k: 'p 值', v: '< 0.001' }] },
    { title: '试验 vs 对照', subtitle: 'OS 对峙',
      a_label: 'CX-204', a_value: '67%', a_unit: '5 年 OS', a_details: ['HR = 0.52', 'p < 0.001'],
      b_label: '标准疗法', b_value: '42%', b_unit: '5 年 OS', b_details: ['现有 SOC', '安慰剂对照'],
      verdict: '+25pp', verdict_note: '绝对生存获益' },
    { title: '多指标台账', subtitle: 'CX-204 vs 对照 · 全终点',
      headers: ['终点', 'CX-204', '对照', 'HR / p'], highlight_col: 1,
      rows: [['OS(5 年)', '67%', '42%', 'HR=0.52'], ['PFS(中位)', '14.2 月', '8.1 月', 'HR=0.48'], ['ORR', '72%', '41%', '—'], ['3-4 级 AE', '38%', '31%', '可控']] },
    { title: '作用机制', subtitle: '靶点 X 抑制 → 通路 Y 阻断 → 凋亡激活',
      before_label: '传统化疗', after_label: 'CX-204', reduction: '复发风险降低 48%',
      before_items: ['广谱细胞毒', '选择性低', '耐药快'],
      after_items: ['靶点 X 高选择', '通路 Y 阻断', '凋亡激活'] },
    { title: '试验时间线', subtitle: '2022 入组 → 2025 读出',
      nodes: [
        { year: '2022', title: '入组启动', desc: 'n=480 随机' },
        { year: '2023', title: '给药完成', desc: 'Q3W × 18 周期' },
        { year: '2024', title: '中期分析', desc: 'OS 显著获益', accent: true },
        { year: '2025', title: '主要读出', desc: '达到主要终点', accent: true } ] },
    { title: 'PI 评价', number: '07', who: 'R. Tanaka', role: '主要研究者(PI) · 肿瘤学',
      quote: '这是十年来该领域最显著的总生存获益。' },
    { title: '结论要点', subtitle: 'III 期读出结论',
      items: [
        { t: 'OS 显著获益', d: '67% vs 42%,HR=0.52,p<0.001' },
        { t: '安全性可控', d: '3-4 级 AE 38%,无新安全信号' },
        { t: 'NDA 启动', d: 'Q4 报产申请提交' } ] },
    { title: '下一步', topic: 'CX-204 · NEXT', body: 'CX-204 将于 Q4 提交 NDA,有望成为晚期 NSCLC 一线新标准。', stamp: '2026 · NDA Q4' },
  ],
};

function main() {
  const arg = process.argv[2];
  const input = (!arg || arg === '--demo') ? MEDICAL : JSON.parse(fs.readFileSync(arg, 'utf8'));
  const routed = routeDeck(input);
  const html = assembleDeck(input, routed);
  const out = process.argv[3] || path.join(ROOT, 'output', `archetype-deck.html`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log('✅ 生成 deck:', path.relative(ROOT, out));
  console.log('   主题:', input.topic);
  console.log('   路由:', routed.deck_check.hint);
}

if (require.main === module) main();
module.exports = { fillArchetype, assembleDeck, MEDICAL };
