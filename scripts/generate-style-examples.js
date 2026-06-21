#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const decks = [
  {
    file: 'style-01-consulting-memo.html',
    title: '商务咨询 Memo',
    bodyClass: 'consulting',
    label: 'Business Consulting',
    claim: '标题即结论，结构先于装饰。',
    audience: '战略汇报 / 复盘 / 管理层决策',
    grammar: 'decision memo, issue tree, option matrix',
    cover: '<div class="memo-head"><span>Decision memo</span><span>Board review</span></div><h1>该砍掉的不是预算，是低质量选择。</h1><div class="memo-grid"><div>Protect<br><b>现金流</b></div><div>Invest<br><b>增长线</b></div><div>Exit<br><b>低效项</b></div><div>Build<br><b>壁垒</b></div></div>',
    slide2: '<h2>一页只回答一个决策问题</h2><div class="issue-tree"><div>问题</div><div>原因 A</div><div>原因 B</div><div>动作</div></div>',
    slide3: '<h2>矩阵不是装饰，是判断压缩器</h2><div class="option-table"><div>影响高 / 投入低</div><div>立即做</div><div>影响高 / 投入高</div><div>拆风险</div><div>影响低 / 投入低</div><div>自动化</div><div>影响低 / 投入高</div><div>停止</div></div>',
  },
  {
    file: 'style-02-minimal-keynote.html',
    title: '极简 Keynote',
    bodyClass: 'minimal',
    label: 'Minimal Keynote',
    claim: '少字不是空，是把注意力交给一句话。',
    audience: 'CEO 演讲 / 发布会开场 / 观点表达',
    grammar: 'single claim, white field, silence',
    cover: '<div class="quiet-mark">02</div><h1>少即是记忆点。</h1><p class="single-line">一句观点，一处停顿，一个可复述的画面。</p>',
    slide2: '<h2>屏幕只放观众必须看的东西。</h2><div class="silent-field"><span>one idea</span></div>',
    slide3: '<h2>演讲者负责细节，幻灯片负责锚点。</h2><p class="single-line">适合大场景，不适合会后阅读型报告。</p>',
  },
  {
    file: 'style-03-data-story.html',
    title: '数据叙事',
    bodyClass: 'data',
    label: 'Data Storytelling',
    claim: '先提出问题，再让趋势给答案。',
    audience: '经营分析 / 研究报告 / 行业判断',
    grammar: 'question rail, chart wall, annotation',
    cover: '<div class="question-rail"><span>Question</span><b>增长是否真的健康？</b></div><div class="chart-wall"><i></i><i></i><i></i><i></i><i></i></div>',
    slide2: '<h2>图表必须带结论，不只是带数据。</h2><div class="slope"><span></span><b>异常点</b></div>',
    slide3: '<h2>来源、口径、标注是设计的一部分。</h2><div class="source-strip">Source slot / scope / date / method</div>',
  },
  {
    file: 'style-04-product-launch.html',
    title: '产品发布',
    bodyClass: 'launch',
    label: 'Product Launch',
    claim: '先让产品上台，再让文字解释。',
    audience: '新品发布 / Demo / 版本更新',
    grammar: 'device stage, cue stack, product proof',
    cover: '<div class="stage-copy"><span>Live demo</span><h1>让界面成为主角。</h1></div><div class="device"><div></div><div></div><div></div></div>',
    slide2: '<h2>能力差异要落在真实状态上。</h2><div class="cue-stack"><b>Before</b><b>After</b><b>Ship</b></div>',
    slide3: '<h2>发布页需要节奏，不需要功能表。</h2><div class="stage-line"><span></span><span></span><span></span></div>',
  },
  {
    file: 'style-05-education-workshop.html',
    title: '教育培训',
    bodyClass: 'education',
    label: 'Education Workshop',
    claim: '路径清楚，比页面炫技重要。',
    audience: '课程 / 工作坊 / 内部培训',
    grammar: 'lesson map, worksheet, checkpoint',
    cover: '<h1>学员需要知道自己在哪一步。</h1><div class="lesson-path"><b>Learn</b><b>See</b><b>Try</b><b>Apply</b></div>',
    slide2: '<h2>每页给一个动作，而不是一段讲义。</h2><div class="worksheet"><span>观察</span><span>练习</span><span>复盘</span></div>',
    slide3: '<h2>回顾页要让下一步变明确。</h2><div class="checklist"><p>完成概念</p><p>完成例子</p><p>完成迁移</p></div>',
  },
  {
    file: 'style-06-pitch-deck.html',
    title: '融资销售 Deck',
    bodyClass: 'pitch',
    label: 'Pitch Deck',
    claim: '把判断路径摆出来，而不是把愿景堆上去。',
    audience: '融资 / 销售 / 商务提案',
    grammar: 'problem proof, traction ladder, ask',
    cover: '<div class="pitch-card"><span>Problem</span><h1>客户不是缺功能，是缺确定性。</h1></div><div class="ask-box">Ask / Pilot / Close</div>',
    slide2: '<h2>痛点、解法、证据必须连续。</h2><div class="traction"><b>痛点</b><b>方案</b><b>证据</b><b>请求</b></div>',
    slide3: '<h2>销售页的重点是降低判断成本。</h2><div class="buyer-map"><span>buyer</span><span>risk</span><span>next</span></div>',
  },
  {
    file: 'style-07-technical-architecture.html',
    title: '技术架构',
    bodyClass: 'technical',
    label: 'Technical Architecture',
    claim: '关系要能被追踪，节点要有责任。',
    audience: '架构评审 / 技术分享 / 故障复盘',
    grammar: 'system console, swimlane, failure rail',
    cover: '<div class="console"><b>gateway</b><b>router</b><b>worker</b><b>observer</b></div><h1>系统图应该解释流动，不是摆盒子。</h1>',
    slide2: '<h2>用泳道表达责任边界。</h2><div class="swimlane"><span>client</span><span>api</span><span>job</span><span>store</span></div>',
    slide3: '<h2>错误路径和恢复路径同样重要。</h2><div class="failure-rail">detect → isolate → recover → report</div>',
  },
  {
    file: 'style-08-editorial-magazine.html',
    title: '编辑杂志',
    bodyClass: 'editorial',
    label: 'Editorial Magazine',
    claim: '像一篇视觉报道，而不是一组卡片。',
    audience: '品牌 / 人物 / 趋势 / 文化主题',
    grammar: 'feature spread, art block, column rhythm',
    cover: '<div class="art-block"></div><div class="feature-copy"><span>Feature</span><h1>标题要像封面，不像模块名。</h1></div>',
    slide2: '<h2>图像和标题形成第一层叙事。</h2><div class="columns"><p>栏目节奏</p><p>留白比例</p><p>段落呼吸</p></div>',
    slide3: '<h2>编辑风不是默认风格，只适合内容有质感的题。</h2><div class="folio">folio / image / quote / note</div>',
  },
  {
    file: 'style-09-brutalist-poster.html',
    title: 'Brutalist Poster',
    bodyClass: 'brutalist',
    label: 'Brutalist Poster',
    claim: '不舒服的秩序，可以制造强记忆。',
    audience: '先锋观点 / AI 评论 / 活动海报',
    grammar: 'hard border, loud crop, warning field',
    cover: '<div class="poster-grid"><b>NO TEMPLATE</b><b>HARD CLAIM</b><b>RAW PROOF</b><b>IMPACT</b></div>',
    slide2: '<h2>粗粝不是乱，是拒绝温顺。</h2><div class="stamp-row"><span>reject</span><span>stress</span><span>proof</span></div>',
    slide3: '<h2>没有强观点时，不要使用这个风格。</h2><div class="warning-block">CONTENT FIRST</div>',
  },
  {
    file: 'style-10-luxury-atelier.html',
    title: '奢侈品牌 Atelier',
    bodyClass: 'luxury',
    label: 'Luxury Atelier',
    claim: '高级感来自比例、材质和克制。',
    audience: '高端品牌 / 时尚 / 美妆 / 生活方式',
    grammar: 'plinth, material rail, lookbook spacing',
    cover: '<div class="plinth"><i></i></div><div class="atelier-copy"><span>Atelier</span><h1>少量元素必须足够准确。</h1></div>',
    slide2: '<h2>材质说明比形容词更有说服力。</h2><div class="material-rail"><span>brushed metal</span><span>quiet leather</span><span>warm shadow</span></div>',
    slide3: '<h2>留白是展示柜，不是空白。</h2><div class="lookbook-strip"><i></i><i></i><i></i></div>',
  },
  {
    file: 'style-11-illustrated-workshop.html',
    title: '手绘工作坊',
    bodyClass: 'illustrated',
    label: 'Illustrated Workshop',
    claim: '亲近感来自参与结构，不是涂鸦堆叠。',
    audience: '轻培训 / 共创 / 儿童教育 / 团队练习',
    grammar: 'worksheet, sticker notes, imperfect alignment',
    cover: '<h1>把压力降下来，把任务说清楚。</h1><div class="notes"><b>Prompt</b><b>Draw</b><b>Share</b><b>Revise</b></div>',
    slide2: '<h2>手作感不能牺牲可读性。</h2><div class="worksheet-grid"><span></span><span></span><span></span><span></span></div>',
    slide3: '<h2>每张贴纸都应该对应一个动作。</h2><div class="action-notes"><p>写下观察</p><p>圈出矛盾</p><p>改写方案</p></div>',
  },
  {
    file: 'style-12-retro-memphis.html',
    title: 'Retro Memphis',
    bodyClass: 'retro',
    label: 'Retro Memphis',
    claim: '几何撞色要制造节奏，不要吞掉内容。',
    audience: '创意活动 / Campaign / 作品集',
    grammar: 'geometric field, loud palette, event energy',
    cover: '<div class="memphis"><i></i><i></i><i></i><i></i><i></i><i></i></div><h1>让活动页有声音。</h1>',
    slide2: '<h2>复古不是滤镜，是构成语言。</h2><div class="shape-row"><span></span><span></span><span></span></div>',
    slide3: '<h2>高能色彩必须配短文案。</h2><div class="ticket">event / venue / call</div>',
  },
];

function commonHead(deck) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${deck.title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/theme/white.css">
  <link href="https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&family=Chivo+Mono:wght@400;500;600&family=Literata:opsz,wght@7..72,400;7..72,600;7..72,700&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@500;700&display=swap" rel="stylesheet">
  <style>`;
}

const css = `
:root {
  --bg: oklch(97% 0.006 250);
  --c-bg: var(--bg);
  --ink: oklch(18% 0.018 248);
  --muted: oklch(45% 0.03 248);
  --line: oklch(76% 0.02 248);
  --accent: oklch(55% 0.14 26);
  --c-accent: var(--accent);
  --f-sans: "Afacad", "Noto Sans SC", ui-sans-serif, system-ui, sans-serif;
  --f-serif: "Literata", "Noto Serif SC", Georgia, serif;
  --f-mono: "Chivo Mono", ui-monospace, monospace;
  --f-display: var(--f-serif);
}
html, body, .reveal { background: var(--bg); color: var(--ink); font-family: var(--f-sans); }
.reveal { font-size: 30px; }
.reveal .slides { text-align: left; }
.reveal section { box-sizing: border-box; height: 100%; overflow: hidden; padding: 48px 60px; }
.reveal h1, .reveal h2, .reveal h3, .reveal p, .reveal div, .reveal span, .reveal b { overflow-wrap: break-word; word-break: break-word; }
.reveal h1, .reveal h2, .reveal h3, .reveal p { margin: 0; text-wrap: balance; }
.reveal h1 { font-size: 3.15em; line-height: 0.96; letter-spacing: 0; font-weight: 700; }
.reveal h2 { font-size: 2em; line-height: 1.03; letter-spacing: 0; font-weight: 700; }
.reveal p { color: var(--muted); font-size: 0.72em; line-height: 1.45; text-wrap: pretty; }
.deck-flex { display: flex; }
.deck-grid { display: grid; }
.reveal .slides > section.deck-flex.present { display: flex !important; top: 0 !important; }
.reveal .slides > section.deck-grid.present { display: grid !important; top: 0 !important; }
.label, .pin { font-family: var(--f-mono); font-size: 0.46em; font-weight: 600; letter-spacing: 0.12em; line-height: 1.2; text-transform: uppercase; }
.label { color: var(--muted); }
.pin { bottom: 24px; color: color-mix(in oklch, currentColor 45%, transparent); left: 60px; position: absolute; }
.meta { border-top: 1px solid currentColor; display: grid; gap: 16px; grid-template-columns: 1fr 0.72fr; margin-top: 24px; padding-top: 14px; }
.meta p { color: currentColor; opacity: 0.72; }
.note { border: 1px solid currentColor; font-family: var(--f-mono); font-size: 0.48em; line-height: 1.35; padding: 10px 12px; }
.cover .label { margin-bottom: 18px; }
.closing { align-items: center; justify-content: center; text-align: center; }
.closing h2 { max-width: 12ch; }

.consulting { --bg: oklch(96% 0.01 240); --accent: oklch(48% 0.12 22); }
.consulting .cover { grid-template-rows: auto 1fr; gap: 22px; }
.memo-head { border-bottom: 2px solid currentColor; display:flex; font-family:var(--f-mono); font-size:.55em; justify-content:space-between; letter-spacing:.08em; padding-bottom:12px; text-transform:uppercase; }
.memo-grid { border:2px solid currentColor; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); min-height:260px; }
.memo-grid div { border-left:1px solid currentColor; display:flex; flex-direction:column; font-size:.6em; justify-content:space-between; letter-spacing:.08em; padding:18px; text-transform:uppercase; }
.memo-grid div:first-child { border-left:0; }
.memo-grid b { font-size:1.65em; text-transform:none; }
.issue-tree { display:grid; gap:16px; grid-template-columns:1fr 1fr 1fr 1fr; margin-top:44px; }
.issue-tree div, .option-table div { border:2px solid currentColor; padding:20px; }
.option-table { display:grid; grid-template-columns:1fr 1fr; margin-top:36px; }

.minimal { --bg: oklch(99% 0.002 250); --accent: oklch(42% 0.1 20); }
.minimal .cover { flex-direction:column; justify-content:space-between; }
.quiet-mark { font-family:var(--f-mono); font-size:.55em; letter-spacing:.16em; }
.minimal h1 { font-size:5.8em; max-width:7ch; }
.single-line { max-width:34ch; }
.silent-field { border-top:2px solid currentColor; font-family:var(--f-mono); font-size:.7em; margin-top:70px; padding-top:28px; }

.data { --bg: oklch(14% 0.026 253); --ink: oklch(94% 0.014 248); --muted: oklch(74% 0.04 230); --accent: oklch(74% 0.12 204); }
.data .cover { grid-template-columns:.58fr 1.42fr; gap:34px; }
.question-rail { border:1px solid currentColor; display:flex; flex-direction:column; gap:20px; justify-content:space-between; padding:22px; }
.question-rail span { font-family:var(--f-mono); font-size:.5em; letter-spacing:.12em; text-transform:uppercase; }
.question-rail b { font-size:1.6em; line-height:1.1; }
.chart-wall { align-items:end; display:grid; gap:14px; grid-template-columns:repeat(5,minmax(0,1fr)); }
.chart-wall i { background:var(--accent); display:block; min-height:90px; }
.chart-wall i:nth-child(2){min-height:150px;background:oklch(80% .12 86)} .chart-wall i:nth-child(3){min-height:230px;background:oklch(68% .13 154)} .chart-wall i:nth-child(4){min-height:310px;background:oklch(69% .14 24)} .chart-wall i:nth-child(5){min-height:410px;background:oklch(75% .13 306)}
.slope { border-bottom:2px solid currentColor; height:310px; margin-top:44px; position:relative; }
.slope span { background:var(--accent); display:block; height:4px; position:absolute; top:170px; transform:rotate(-12deg); width:82%; }
.slope b { background:oklch(80% .12 86); color:oklch(14% .026 253); padding:8px 12px; position:absolute; right:40px; top:80px; }
.source-strip { border:1px solid currentColor; font-family:var(--f-mono); margin-top:60px; padding:18px; }

.launch { --bg: oklch(16% 0.05 285); --ink: oklch(96% 0.01 285); --muted: oklch(76% 0.06 286); --accent: oklch(72% 0.12 306); }
.launch .cover { grid-template-columns:.64fr 1fr; gap:36px; }
.stage-copy span { color:var(--accent); font-family:var(--f-mono); font-size:.55em; letter-spacing:.16em; text-transform:uppercase; }
.device { background:oklch(21% .045 285); border:2px solid var(--accent); display:grid; gap:16px; grid-template-rows:.7fr 1fr .8fr; padding:22px; }
.device div { background:oklch(92% .02 285); }
.cue-stack { display:grid; gap:14px; grid-template-columns:repeat(3,minmax(0,1fr)); margin-top:48px; }
.cue-stack b, .stage-line span { background:var(--accent); color:oklch(16% .05 285); padding:18px; }
.stage-line { display:flex; gap:14px; margin-top:60px; } .stage-line span { display:block; height:110px; flex:1; }

.education { --bg: oklch(96% 0.022 142); --ink: oklch(21% 0.045 148); --muted: oklch(42% 0.055 148); --accent: oklch(58% 0.12 156); }
.education .cover { grid-template-rows:auto 1fr; gap:46px; }
.lesson-path { display:grid; gap:14px; grid-template-columns:repeat(4,minmax(0,1fr)); }
.lesson-path b, .worksheet span, .checklist p { background:oklch(99% .008 142); border:1px solid oklch(72% .05 142); padding:22px; }
.worksheet { display:grid; gap:14px; grid-template-columns:repeat(3,minmax(0,1fr)); margin-top:46px; }
.checklist { display:flex; flex-direction:column; gap:12px; margin-top:40px; }

.pitch { --bg: oklch(23% 0.055 54); --ink: oklch(95% 0.02 70); --muted: oklch(78% 0.04 70); --accent: oklch(82% 0.12 86); }
.pitch .cover { grid-template-columns:1fr .58fr; gap:28px; }
.pitch-card { background:oklch(95% .02 70); color:oklch(23% .055 54); padding:28px; }
.pitch-card span { font-family:var(--f-mono); font-size:.55em; letter-spacing:.12em; text-transform:uppercase; }
.ask-box { align-items:center; border:2px solid currentColor; display:flex; font-family:var(--f-mono); justify-content:center; text-align:center; }
.traction { display:grid; gap:10px; grid-template-columns:repeat(4,minmax(0,1fr)); margin-top:48px; } .traction b, .buyer-map span { background:oklch(95% .02 70); color:oklch(23% .055 54); padding:18px; }
.buyer-map { display:flex; gap:12px; margin-top:50px; }

.technical { --bg: oklch(12% 0.02 228); --ink: oklch(92% 0.015 218); --muted: oklch(72% 0.04 218); --accent: oklch(76% 0.11 204); }
.technical .cover { grid-template-columns:1fr .8fr; gap:28px; }
.console { border:1px solid var(--accent); display:grid; gap:10px; grid-template-columns:repeat(2,minmax(0,1fr)); padding:18px; }
.console b, .swimlane span { background:oklch(18% .03 228); border:1px solid var(--accent); color:var(--accent); font-family:var(--f-mono); padding:18px; }
.swimlane { display:grid; gap:12px; grid-template-columns:repeat(4,minmax(0,1fr)); margin-top:46px; }
.failure-rail { border:1px solid var(--accent); color:var(--accent); font-family:var(--f-mono); margin-top:52px; padding:22px; }

.editorial { --bg: oklch(95% 0.008 78); --ink: oklch(21% 0.045 54); --muted: oklch(43% 0.05 54); --accent: oklch(52% 0.14 28); }
.editorial .cover { grid-template-columns:1.08fr .92fr; gap:28px; }
.editorial h1, .editorial h2 { font-family:var(--f-serif); }
.art-block { background:linear-gradient(135deg, oklch(36% .09 42), oklch(74% .06 68)); min-height:520px; }
.feature-copy { border-bottom:2px solid currentColor; border-top:2px solid currentColor; padding:24px 0; }
.feature-copy span { font-family:var(--f-mono); font-size:.55em; letter-spacing:.12em; text-transform:uppercase; }
.columns { display:grid; gap:18px; grid-template-columns:repeat(3,minmax(0,1fr)); margin-top:42px; }
.columns p, .folio { border-top:1px solid currentColor; padding-top:14px; }
.folio { font-family:var(--f-mono); margin-top:54px; }

.brutalist { --bg: oklch(94% 0.018 96); --ink: oklch(10% 0.012 96); --muted: oklch(32% 0.03 96); --accent: oklch(76% 0.18 114); }
.brutalist h1, .brutalist h2 { text-transform:uppercase; letter-spacing:.035em; }
.poster-grid { border:4px solid currentColor; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); min-height:520px; }
.poster-grid b { align-items:center; border:2px solid currentColor; display:flex; font-size:1.5em; justify-content:center; letter-spacing:.04em; padding:22px; text-align:center; text-transform:uppercase; }
.poster-grid b:nth-child(1), .poster-grid b:nth-child(4), .warning-block { background:var(--accent); }
.stamp-row { display:grid; gap:12px; grid-template-columns:repeat(3,minmax(0,1fr)); margin-top:42px; } .stamp-row span { border:3px solid currentColor; font-weight:700; letter-spacing:.04em; padding:20px; text-transform:uppercase; }
.warning-block { border:4px solid currentColor; font-size:2em; font-weight:700; letter-spacing:.04em; margin-top:48px; padding:28px; text-align:center; }

.luxury { --bg: oklch(18% 0.028 54); --ink: oklch(91% 0.02 72); --muted: oklch(75% 0.035 72); --accent: oklch(78% 0.04 72); }
.luxury .cover { grid-template-columns:1.2fr .8fr; gap:34px; }
.luxury h1, .luxury h2 { font-family:var(--f-serif); }
.plinth { background:var(--accent); display:grid; min-height:520px; place-items:center; } .plinth i { border:2px solid oklch(20% .04 54); display:block; height:280px; width:190px; }
.atelier-copy { align-self:center; } .atelier-copy span { font-family:var(--f-mono); font-size:.55em; letter-spacing:.12em; text-transform:uppercase; }
.material-rail { display:grid; gap:14px; grid-template-columns:repeat(3,minmax(0,1fr)); margin-top:46px; } .material-rail span, .lookbook-strip i { border:1px solid currentColor; padding:20px; }
.lookbook-strip { display:grid; gap:12px; grid-template-columns:repeat(3,minmax(0,1fr)); margin-top:52px; } .lookbook-strip i { display:block; min-height:170px; }

.illustrated { --bg: oklch(97% 0.025 84); --ink: oklch(22% 0.04 74); --muted: oklch(46% 0.045 74); --accent: oklch(70% 0.12 42); }
.illustrated .cover { grid-template-rows:auto 1fr; gap:40px; }
.notes { display:grid; gap:14px; grid-template-columns:repeat(4,minmax(0,1fr)); transform:rotate(-1deg); }
.notes b, .worksheet-grid span, .action-notes p { background:oklch(99% .01 84); border:2px solid currentColor; padding:22px; }
.notes b:nth-child(2), .action-notes p:nth-child(2) { transform:rotate(2deg); }
.worksheet-grid { display:grid; gap:14px; grid-template-columns:repeat(2,minmax(0,1fr)); margin-top:42px; } .worksheet-grid span { min-height:130px; }
.action-notes { display:flex; gap:14px; margin-top:48px; }

.retro { --bg: oklch(91% 0.06 82); --ink: oklch(20% 0.04 268); --muted: oklch(37% 0.06 268); --accent: oklch(68% 0.16 330); }
.retro .cover { display:block; position:relative; }
.retro h1 { background:var(--bg); border:3px solid currentColor; left:80px; max-width:8ch; padding:18px; position:absolute; top:70px; z-index:2; }
.memphis { display:grid; gap:12px; grid-template-columns:repeat(4,minmax(0,1fr)); grid-template-rows:repeat(3,minmax(0,1fr)); height:100%; }
.memphis i, .shape-row span { border:2px solid currentColor; display:block; }
.memphis i:nth-child(1){background:oklch(72% .16 20);grid-column:span 2}.memphis i:nth-child(2){background:oklch(82% .14 88)}.memphis i:nth-child(3){background:oklch(68% .14 204);grid-row:span 2}.memphis i:nth-child(4){background:oklch(74% .13 148)}.memphis i:nth-child(5){background:oklch(68% .16 330);grid-column:span 2}.memphis i:nth-child(6){background:oklch(96% .01 82);grid-column:span 3}
.shape-row { display:grid; gap:14px; grid-template-columns:repeat(3,minmax(0,1fr)); margin-top:44px; } .shape-row span { min-height:150px; } .shape-row span:nth-child(1){background:oklch(72% .16 20)} .shape-row span:nth-child(2){background:oklch(82% .14 88)} .shape-row span:nth-child(3){background:oklch(68% .14 204)}
.ticket { background:var(--accent); border:3px solid currentColor; font-family:var(--f-mono); margin-top:48px; padding:24px; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration: 1ms !important; animation-duration: 1ms !important; } }
`;

function html(deck) {
  return `${commonHead(deck)}
${css}
  </style>
</head>
<body class="${deck.bodyClass}">
  <div class="reveal">
    <div class="slides">
      <section class="cover deck-grid">
        ${deck.cover}
        <div class="pin">${deck.label}</div>
      </section>
      <section class="deck-grid">
        <div class="label">${deck.label}</div>
        <h2>${deck.claim}</h2>
        <div class="meta">
          <p>${deck.audience}</p>
          <div class="note">${deck.grammar}</div>
        </div>
      </section>
      <section class="deck-flex" style="flex-direction:column;">
        ${deck.slide2}
      </section>
      <section>
        ${deck.slide3}
      </section>
      <section class="closing deck-flex">
        <h2>${deck.title}</h2>
        <div class="pin">example / ${deck.file.replace('.html', '')}</div>
      </section>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.6.0/dist/reveal.js"></script>
  <script>
    Reveal.initialize({
      width: 1280,
      height: 720,
      margin: 0,
      minScale: 0.2,
      maxScale: 2,
      hash: true,
      slideNumber: 'c/t',
      progress: true,
      center: false,
      controls: true,
      controlsTutorial: false,
      transition: 'fade'
    });
  </script>
</body>
</html>
`;
}

const outDir = path.join(root, 'examples');
for (const deck of decks) {
  fs.writeFileSync(path.join(outDir, deck.file), html(deck));
}

console.log(`Generated ${decks.length} style example decks.`);
