'use strict';

// Controlled editor: edits only the manifest + registry-approved props.
// Directive: no free-form DOM authoring, no dynamic code execution, and never bind
//   untrusted strings as element markup — use textContent / createElement.
// New editable controls require a manifest field + layout-registry declaration first.

const state = {
  manifest: null,
  etag: null,
  selectedId: null,
  saveTimer: null,
  registry: { layouts: [] },
};

const el = (id) => document.getElementById(id);
const setSave = (t) => { el('save-status').textContent = t; };
const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };

function layoutFor(code) {
  return state.registry.layouts.find((l) => l.code === code) || null;
}

function allowedKeys(slide) {
  const lay = layoutFor(slide.archetype);
  if (!lay) return new Set(Object.keys(slide.props || {}));
  return new Set([].concat(lay.requiredProps, lay.optionalProps));
}

function renderSlideList() {
  const nav = el('slide-list');
  clear(nav);
  state.manifest.slides.forEach((s) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = s.id + ' · ' + s.archetype;
    btn.className = s.id === state.selectedId ? 'slide-item selected' : 'slide-item';
    btn.addEventListener('click', () => selectSlide(s.id));
    nav.appendChild(btn);
  });
}

function renderPropertyPanel() {
  const panel = el('property-panel');
  clear(panel);
  const slide = state.manifest.slides.find((s) => s.id === state.selectedId);
  if (!slide) return;
  const lay = layoutFor(slide.archetype);

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = 'role: ' + slide.role + ' · archetype: ' + slide.archetype + ' · pptx: ' + (lay ? lay.pptxStrategy : '?');
  panel.appendChild(meta);

  const form = document.createElement('div');
  form.className = 'prop-form';
  const keys = new Set([].concat(
    lay ? lay.requiredProps : [],
    lay ? lay.optionalProps : [],
    Object.keys(slide.props || {}),
  ));
  keys.forEach((k) => {
    const row = document.createElement('label');
    row.className = 'prop-row';
    const lbl = document.createElement('span');
    lbl.textContent = k + (lay && lay.requiredProps && lay.requiredProps.includes(k) ? ' *' : '');
    const input = document.createElement('input');
    input.type = 'text';
    const val = slide.props[k];
    input.value = typeof val === 'string' ? val : (val === undefined || val === null ? '' : JSON.stringify(val));
    input.addEventListener('change', () => updateSlideProp(slide.id, k, input.value));
    row.appendChild(lbl);
    row.appendChild(input);
    form.appendChild(row);
  });
  panel.appendChild(form);

  // motionIntent is a fixed enum, not free text
  const motionRow = document.createElement('label');
  motionRow.className = 'prop-row';
  const mLabel = document.createElement('span');
  mLabel.textContent = 'motionIntent';
  const sel = document.createElement('select');
  ['none', 'fragment', 'loop', 'count-in', 'draw', 'grow'].forEach((m) => {
    const o = document.createElement('option');
    o.value = m;
    o.textContent = m;
    if (m === slide.motionIntent) o.selected = true;
    sel.appendChild(o);
  });
  sel.addEventListener('change', () => { slide.motionIntent = sel.value; scheduleSave(); });
  motionRow.appendChild(mLabel);
  motionRow.appendChild(sel);
  panel.appendChild(motionRow);

  // media + evidence are read-only summaries (full editors land in later tasks)
  el('media-panel').textContent = slide.mediaSlots && slide.mediaSlots.length
    ? '媒体槽位: ' + slide.mediaSlots.map((m) => m.slotId || m.id).join(', ')
    : '媒体槽位: 无';
  el('evidence-panel').textContent = slide.evidence && slide.evidence.length
    ? '证据: ' + slide.evidence.map((e) => e.id + '(' + e.status + ')').join(', ')
    : '证据: 无';
}

function selectSlide(id) {
  state.selectedId = id;
  renderSlideList();
  renderPropertyPanel();
}

function updateSlideProp(slideId, key, value) {
  const slide = state.manifest.slides.find((s) => s.id === slideId);
  if (!slide) throw new Error('unknown slide: ' + slideId);
  const allowed = allowedKeys(slide);
  if (!allowed.has(key)) throw new Error('prop is not editable: ' + key);
  slide.props[key] = value;
  scheduleSave();
}

function scheduleSave() {
  window.clearTimeout(state.saveTimer);
  state.saveTimer = window.setTimeout(saveManifest, 500);
}

async function saveManifest() {
  setSave('保存中');
  state.manifest.title = el('deck-title').value;
  const r = await fetch('/api/manifest', {
    method: 'PUT',
    headers: { 'content-type': 'application/json', 'if-match': state.etag },
    body: JSON.stringify(state.manifest),
  });
  if (r.status === 409) { setSave('检测到外部修改,请重新加载'); return; }
  if (r.status === 422) { const e = await r.json(); setSave((e.errors || []).join('; ') || '保存失败'); return; }
  if (!r.ok) { setSave('保存失败 (' + r.status + ')'); return; }
  state.etag = r.headers.get('etag');
  setSave('已同步');
}

async function doRender() {
  setSave('渲染中');
  const r = await fetch('/api/render', { method: 'POST' });
  const j = await r.json();
  if (j.ok) {
    el('preview-frame').src = '/preview/' + j.html + '?t=' + Date.now();
    setSave('已同步');
  } else {
    setSave('渲染失败');
  }
}

async function runQA() {
  el('qa-status').textContent = 'QA 运行中(地板,无视觉)';
  const r = await fetch('/api/qa', { method: 'POST' });
  const j = await r.json();
  const g = j.summary && j.summary.gates;
  const labels = { grade: 'grade-gate', designStrength: 'design-strength', elementQuality: 'element-quality', editorialContamination: 'editorial', imageAudit: 'image-audit', visual: 'visual' };
  if (g) {
    const order = ['grade', 'designStrength', 'elementQuality', 'editorialContamination', 'imageAudit', 'visual'];
    const parts = order.filter(k => g[k]).map(k => labels[k] + ':' + g[k]);
    // 任一必需地板门禁非 pass/skipped → 不显示绿色顶层状态(视觉层在 --no-visual 下为 skipped)
    const floorClean = ['grade', 'designStrength', 'elementQuality', 'editorialContamination', 'imageAudit']
      .every(k => g[k] === 'pass' || g[k] === 'skipped');
    const prefix = (j.ok && floorClean) ? '✓ ' : '⚠ ';
    el('qa-status').textContent = prefix + parts.join(' · ') + (j.summary.state ? '  [state=' + j.summary.state + ']' : '');
  } else {
    el('qa-status').textContent = j.ok
      ? 'QA 地板通过(grade-gate/design-strength/element-quality/editorial)'
      : 'QA 有失败 — ' + String(j.detail || '').slice(0, 220);
  }
}

async function exportPptx() {
  el('qa-status').textContent = 'PPTX 导出中';
  const r = await fetch('/api/export/pptx', { method: 'POST' });
  const j = await r.json();
  el('qa-status').textContent = j.ok ? ('已导出 ' + j.pptx) : '导出失败';
}

async function loadManifest() {
  const r = await fetch('/api/manifest');
  state.etag = r.headers.get('etag');
  state.manifest = await r.json();
  el('deck-title').value = state.manifest.title || '';
  el('route-summary').textContent = '路径 ' + state.manifest.route.path
    + (state.manifest.route.wow ? ' · wow' : '') + ' · ' + state.manifest.slides.length + ' 页';
  renderSlideList();
  if (state.manifest.slides[0]) selectSlide(state.manifest.slides[0].id);
}

async function boot() {
  el('deck-title').addEventListener('change', scheduleSave);
  el('action-render').addEventListener('click', doRender);
  el('action-qa').addEventListener('click', runQA);
  el('action-export').addEventListener('click', exportPptx);
  try {
    const rr = await fetch('/api/registry');
    state.registry = await rr.json();
  } catch (e) { /* registry optional — props still editable from manifest */ }
  await loadManifest();
  await doRender();
}

document.addEventListener('DOMContentLoaded', boot);
