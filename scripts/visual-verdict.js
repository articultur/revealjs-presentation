#!/usr/bin/env node
/**
 * LLM Visual Verdict
 * ------------------------------------------------------------
 * Uses a vision-capable model to review rendered slide screenshots for
 * semantic/design failures that deterministic bbox checks miss:
 * unreadable labels, unclear proof objects, weak hierarchy, page markers
 * that feel visually wrong, chart/diagram pages that do not explain
 * the action title, and image-driven decks whose photos feel repeated,
 * low-grade, semantically mismatched, or stylistically fragmented.
 *
 * Usage:
 *   node scripts/visual-verdict.js deck.html --out output/deck-verdict
 *   node scripts/visual-verdict.js deck.html --slides 2,5,6
 *   node scripts/visual-verdict.js deck.html --dry-run
 *   node scripts/visual-verdict.js deck.html --launch   发布会级:平庸/AI 味 warning 升级为 blocker
 *
 * Environment:
 *   OPENAI_API_KEY       required unless --dry-run
 *   OPENAI_VISUAL_MODEL  optional, defaults to gpt-4.1
 *
 * Exit codes:
 *   0 - verdict passed, or --dry-run wrote review inputs
 *   1 - model found blocking visual issues
 *   2 - setup/API/schema error
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// require.main 守卫:被 require 时跳过 CLI 引导,computeVerdict 可在无 key 环境独立单测
const isCli = require.main === module;
const args = isCli ? process.argv.slice(2) : [];
const htmlFile = args.find(arg => !arg.startsWith('--')) || null;
const outArgIndex = args.indexOf('--out');
const slidesArgIndex = args.indexOf('--slides');
const dryRun = args.includes('--dry-run');
const skipCapture = args.includes('--skip-capture');
const launchMode = args.includes('--launch');  // 发布会级「平庸即 blocker」:weak-design-impact 等 warning 升级为 blocker
const modelArg = args.find(arg => arg.startsWith('--model='));
const waitArg = args.find(arg => arg.startsWith('--wait='));
const waitMs = waitArg ? Number(waitArg.split('=')[1]) : 1500;  // 字体加载需 ≥1.5s,防 FOUT 闪烁致截图中字体未就位(误判)

if (isCli && !htmlFile) {
  console.error('Usage: node scripts/visual-verdict.js <html-file> [--out dir] [--slides 2,5] [--dry-run] [--launch] [--model=name] [--provider=responses|chat]');
  process.exit(2);
}

const filePath = htmlFile ? path.resolve(htmlFile) : null;
if (isCli && filePath && !fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(2);
}

const outDir = !filePath
  ? null
  : outArgIndex >= 0 && args[outArgIndex + 1]
    ? path.resolve(args[outArgIndex + 1])
    : path.join(path.dirname(filePath), `${path.basename(filePath, '.html')}-visual-verdict`);

const selectedSlides = slidesArgIndex >= 0 && args[slidesArgIndex + 1]
  ? new Set(args[slidesArgIndex + 1].split(',').map(s => Number(s.trim())).filter(Boolean))
  : null;

const model = modelArg ? modelArg.split('=')[1] : (process.env.OPENAI_VISUAL_MODEL || 'gpt-4.1');
const apiKey = process.env.OPENAI_API_KEY;
// Provider-agnostic endpoint + transport. OpenAI-native -> Responses API; any
// OpenAI-compatible proxy (GLM/CC-Switch, Azure, local) -> Chat Completions.
const baseURL = (process.env.OPENAI_BASE_URL || process.env.VISUAL_VERDICT_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
const providerArg = args.find(arg => arg.startsWith('--provider='));
const provider = providerArg ? providerArg.split('=')[1]
  : (process.env.VISUAL_VERDICT_PROVIDER || (baseURL.includes('openai.com') ? 'responses' : 'chat'));
const qaDir = outDir ? path.join(outDir, 'screenshots') : null;
const verdictPath = outDir ? path.join(outDir, 'visual-verdict.json') : null;
const promptPath = outDir ? path.join(outDir, 'visual-verdict-prompt.md') : null;

if (isCli) fs.mkdirSync(outDir, { recursive: true });

function readJson(jsonPath) {
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

function imageDataUrl(imagePath) {
  const data = fs.readFileSync(imagePath).toString('base64');
  return `data:image/png;base64,${data}`;
}

function captureScreenshots() {
  if (skipCapture) return;
  const result = spawnSync(process.execPath, [
    path.join(__dirname, 'visual-qa.js'),
    filePath,
    '--out',
    qaDir,
    '--annotate-overflow',
    // fragment 隐藏内容参与评审(2026-07 验收修复):默认截图里 fragment 不可见,
    // 视觉模型会漏审逐步揭示的内容(也可能把"未展开的 fragment"误判成内容缺失)。
    '--show-fragments',
    `--wait=${waitMs}`,
  ], {
    encoding: 'utf8',
    timeout: 180_000,
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`visual-qa failed:\n${result.stdout}\n${result.stderr}`);
  }
}

function buildReviewPayload() {
  const manifestPath = path.join(qaDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing visual-qa manifest: ${manifestPath}`);
  }
  const manifest = readJson(manifestPath);
  const slides = manifest.slides
    .filter(slide => !selectedSlides || selectedSlides.has(slide.slide))
    .map(slide => ({
      slide: slide.slide,
      text: slide.text,
      screenshot: slide.screenshot,
      image_url: imageDataUrl(slide.screenshot),
      overflow: slide.overflow || null,
    }));
  if (!slides.length) throw new Error('No slides selected for review.');
  return { manifest, slides };
}

function systemPrompt() {
  return [
    'You are a strict visual QA reviewer for launch-grade Reveal.js presentations.',
    'Judge only from rendered screenshots and the provided slide text. Do not assume the source code is correct.',
    'Your job is to catch failures deterministic geometry scripts miss: unclear diagrams, unreadable labels, weak hierarchy, ambiguous proof objects, decorative noise, and page furniture that visually collides with the content.',
    'For image-driven decks, photos are evidence, not decoration. Judge whether the image choice, crop, overlay, and repetition support the slide claim and deck theme.',
    'Be concrete and evidence-based. A beautiful style is not enough if the proof object does not explain the action title.',
    'AI 味/模板感是高品质的死敌(spec Innovation 维)。对每页追问:这页像通用 AI 模板吗?有没有本主题原生形式(只有这个主题才该有的版面/对象/notation)?原生形式缺失或纯通用骨架(indigo 渐变/圆角卡/gradient text/side-stripe/「左标题+右图形」换色)= blocker。',
    'Return JSON only, matching the schema.',
  ].join('\n');
}

function userPrompt(slides) {
  const slideList = slides.map(slide => `Slide ${slide.slide}: ${slide.text || '(no extracted text)'}`).join('\n');
  return [
    'Review these rendered slide screenshots.',
    '',
    'Primary checks:',
    '1. Page label / kicker must not touch or visually collide with the sheet frame.',
    '2. Navigation, north mark, footer, pin, or title blocks must not intrude on the main title or proof object.',
    '3. Every important label must be readable at 1280x720 projection scale.',
    '4. Diagrams/charts must clearly explain the slide action title; reject decorative or ambiguous proof objects.',
    '5. Visual hierarchy must make the main claim and proof object obvious within three seconds.',
    '6. Dense tables, routes, timelines, architectural drawings, and dashboards must have enough breathing room and meaningful encoding.',
    '7. Do not fail harmless domain-native notation, but do fail notation that obscures content.',
    '8. Image-driven slides: the photo must be a specific proof object for this slide, not a generic landmark/stock image.',
    '9. Image-driven slides: reject visibly soft, muddy, over-darkened, over-cropped, or cheap-looking full-bleed photos.',
    '10. Image-driven decks: reject cover/chapter/closing photos that repeat the same image or create a fragmented theme.',
    '11. Image-driven decks: reject practical-info/route/data pages whose image does not clarify the information architecture.',
    '12. Design impact: flag ordinary, split, template-like, or low-drama compositions when the stated deck is photo-led/editorial.',
    '13. AI 味/模板感(spec Innovation 维):这页像通用 AI 模板吗(indigo→紫渐变 / 圆角卡 + 左色边 / gradient text / side-stripe / emoji 图标 / 「左标题 + 右图形」换色骨架)?有没有只有本主题才该有的原生形式(版面/对象/notation)?纯通用骨架或原生形式缺失 = blocker(ai-template-tell / weak-native-form)。',
    '14. 字体闪烁重叠风险:大字(logo / 标题 / 大数字)与角元素(stamp / pin / photo-credit / 角标)是否贴得太近(<50px)?字体宽度波动(FOUT)时会撞 = blocker(font-flicker-overlap)。',
    '',
    'Severity rules:',
    '- blocker: user-visible overlap/cropping, unreadable key label, diagram/photo does not explain the claim, repeated hero image, theme-breaking page, or page furniture obstructs content.',
    '- warning: readable but weak hierarchy, mildly ambiguous diagram/photo, generic but usable image, mildly cramped content, or low visual impact.',
    '- note: polish suggestion only.',
    '',
    'Slides to review:',
    slideList,
  ].join('\n');
}

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['passed', 'summary', 'issues'],
  properties: {
    passed: { type: 'boolean' },
    summary: { type: 'string' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['slide', 'severity', 'category', 'evidence', 'suggestedFix'],
        properties: {
          slide: { type: 'integer' },
          severity: { type: 'string', enum: ['blocker', 'warning', 'note'] },
          category: {
            type: 'string',
            enum: [
              'frame-collision',
              'navigation-collision',
              'unreadable-label',
              'unclear-proof-object',
              'weak-visual-hierarchy',
              'chart-does-not-explain-claim',
              'photo-does-not-explain-claim',
              'repeated-photo',
              'low-quality-photo',
              'theme-fragmentation',
              'weak-design-impact',
              'decorative-noise',
              'crowding',
              'ai-template-tell',
              'weak-native-form',
              'font-flicker-overlap',
              'other',
            ],
          },
          evidence: { type: 'string' },
          suggestedFix: { type: 'string' },
        },
      },
    },
  },
};

async function callOpenAI(slides) {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set. Run with --dry-run to inspect prompts without calling the model.');
  }
  if (process.env.VISUAL_VERDICT_OPT_IN !== '1') {
    throw new Error('VISUAL_VERDICT_OPT_IN=1 is required to send deck screenshots to the vision model (prevents accidental external upload). Without it, use --dry-run, or run via qa.js with --visual-signoff after a human review.');
  }

  // Provider-agnostic. OpenAI-native uses the Responses API; any OpenAI-compatible
  // endpoint (GLM/CC-Switch, Azure, local) uses Chat Completions with image_url parts.
  // Point a proxy at the service via OPENAI_BASE_URL + OPENAI_API_KEY + OPENAI_VISUAL_MODEL;
  // provider is auto-detected from the base URL (openai.com -> responses, else -> chat),
  // overridable with --provider=responses|chat or VISUAL_VERDICT_PROVIDER.
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  let endpoint, reqBody;
  if (provider === 'chat') {
    endpoint = `${baseURL}/chat/completions`;
    reqBody = {
      model,
      messages: [
        { role: 'system', content: systemPrompt() },
        { role: 'user', content: [
          { type: 'text', text: userPrompt(slides) },
          ...slides.flatMap(slide => ([
            { type: 'text', text: `Screenshot for slide ${slide.slide}` },
            { type: 'image_url', image_url: { url: slide.image_url } },
          ])),
        ] },
      ],
      // strict:false for broad OpenAI-compatible support (not all enforce strict mode).
      response_format: { type: 'json_schema', json_schema: { name: 'visual_verdict', strict: false, schema } },
    };
  } else {
    endpoint = `${baseURL}/responses`;
    reqBody = {
      model,
      input: [
        { role: 'system', content: [{ type: 'input_text', text: systemPrompt() }] },
        { role: 'user', content: [
          { type: 'input_text', text: userPrompt(slides) },
          ...slides.flatMap(slide => ([
            { type: 'input_text', text: `Screenshot for slide ${slide.slide}` },
            { type: 'input_image', image_url: slide.image_url },
          ])),
        ] },
      ],
      text: { format: { type: 'json_schema', name: 'visual_verdict', strict: true, schema } },
    };
  }

  const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(reqBody) });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Vision API error ${response.status} (${provider} @ ${endpoint}): ${JSON.stringify(body).slice(0, 800)}`);
  }

  const outputText = provider === 'chat'
    ? (body.choices?.[0]?.message?.content || '')
    : (body.output_text || (body.output || [])
        .flatMap(item => item.content || [])
        .map(part => part.text || '')
        .filter(Boolean)
        .join('\n'));
  if (!outputText) throw new Error(`No output from ${provider} response: ${JSON.stringify(body).slice(0, 800)}`);

  // Tolerate providers that wrap JSON in markdown fences or prose.
  const jsonMatch = outputText.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : outputText);
}

// launch 模式「平庸即 blocker」:以下类别(平庸/AI 味/原生形式缺失)的 warning 升级为 blocker
const LAUNCH_ESCALATE_CATEGORIES = new Set(['weak-design-impact', 'ai-template-tell', 'weak-native-form']);

/**
 * 判定合成纯函数(无 key 可单测):模型原始 verdict → 最终 passed。
 * 非 launch 模式行为与历史一致:passed = verdict.passed && 无 blocker,issues 原样返回。
 * launch 模式(发布会级「平庸即 blocker」):
 *   1. weak-design-impact / ai-template-tell / weak-native-form 的 warning 升级为 blocker,
 *      并在条目上显式标注 escalated 字段(↑launch 模式升级,不静默);
 *   2. deck 级规则:weak-design-impact 页数 ≥3 或占比 ≥1/3(取更严)→ 追加一条 deck 级 blocker(slide 0)。
 */
function computeVerdict(verdict, options = {}) {
  const launch = !!options.launch;
  const issues = (verdict.issues || []).map(issue => ({ ...issue }));
  if (launch) {
    for (const issue of issues) {
      if (issue.severity === 'warning' && LAUNCH_ESCALATE_CATEGORIES.has(issue.category)) {
        issue.severity = 'blocker';
        issue.escalated = '↑launch 模式升级 warning→blocker';
      }
    }
    const weakPages = new Set(issues.filter(issue => issue.category === 'weak-design-impact').map(issue => issue.slide));
    const totalSlides = options.totalSlides || Math.max(weakPages.size, ...issues.map(issue => issue.slide || 0));
    const weakRatio = totalSlides > 0 ? weakPages.size / totalSlides : 0;
    if (weakPages.size >= 3 || weakRatio >= 1 / 3) {
      issues.push({
        slide: 0,  // 0 = deck 级判定(非单页)
        severity: 'blocker',
        category: 'weak-design-impact',
        evidence: `↑launch deck 级规则:weak-design-impact ${weakPages.size}/${totalSlides} 页(≥3 页或占比 ≥1/3),「合规但平庸」不予通过`,
        suggestedFix: '回到 storyboard / P5:为平庸页做强主视觉决定(颜色场 / 大字 / 原型切换),而非只修到合规。',
        escalated: '↑launch deck 级规则新增 blocker',
      });
    }
  }
  const blockers = issues.filter(issue => issue.severity === 'blocker');
  return { ...verdict, issues, passed: verdict.passed && blockers.length === 0, launch };
}

if (isCli) (async () => {
  try {
    captureScreenshots();
    const { manifest, slides } = buildReviewPayload();
    const promptDocument = [
      '# Visual Verdict Prompt',
      '',
      '## System',
      systemPrompt(),
      '',
      '## User',
      userPrompt(slides),
      '',
      '## Screenshots',
      ...slides.map(slide => `- Slide ${slide.slide}: ${path.relative(outDir, slide.screenshot)}`),
    ].join('\n');
    fs.writeFileSync(promptPath, promptDocument);

    if (dryRun) {
      const result = {
        passed: null,
        skipped: true,
        reason: 'dry-run',
        launch: launchMode,
        model,
        source: filePath,
        screenshots: path.relative(process.cwd(), qaDir),
        prompt: path.relative(process.cwd(), promptPath),
        slidesReviewed: slides.map(slide => slide.slide),
      };
      fs.writeFileSync(verdictPath, JSON.stringify(result, null, 2));
      console.log(`visual verdict dry-run: ${verdictPath}${launchMode ? '（launch 模式：模型判定后将按发布会级标准把平庸/AI 味 warning 升级为 blocker）' : ''}`);
      process.exit(0);
    }

    const verdict = computeVerdict(await callOpenAI(slides), { launch: launchMode, totalSlides: slides.length });
    const blockers = verdict.issues.filter(issue => issue.severity === 'blocker');
    const escalated = verdict.issues.filter(issue => issue.escalated);
    const result = {
      ...verdict,
      model,
      source: filePath,
      screenshotManifest: manifest.source,
      slidesReviewed: slides.map(slide => slide.slide),
    };
    fs.writeFileSync(verdictPath, JSON.stringify(result, null, 2));

    console.log(`visual verdict: ${result.passed ? 'PASS' : 'FAIL'}${launchMode ? '（launch 模式：平庸/AI 味即 blocker）' : ''}`);
    console.log(`  file: ${verdictPath}`);
    console.log(`  issues: ${result.issues.length} (${blockers.length} blocker${launchMode ? `, 其中 ${escalated.length} 条 ↑launch 模式升级/新增` : ''})`);
    if (!result.passed) {
      for (const issue of result.issues.filter(issue => issue.severity !== 'note').slice(0, 8)) {
        console.log(`  slide ${issue.slide} [${issue.severity}/${issue.category}]${issue.escalated ? ` ${issue.escalated}` : ''}: ${issue.evidence}`);
      }
    }
    process.exit(result.passed ? 0 : 1);
  } catch (err) {
    const result = {
      passed: null,
      error: err.message,
      model,
      source: filePath,
    };
    fs.writeFileSync(verdictPath, JSON.stringify(result, null, 2));
    console.error(`visual verdict failed: ${err.message}`);
    console.error(`  file: ${verdictPath}`);
    process.exit(2);
  }
})();

module.exports = { computeVerdict };
