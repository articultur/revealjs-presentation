'use strict';

// Label-class + 角标元素：真正的索引/元数据/角标小元素。
// `[class*="badge"]` 覆盖 .badge / .badge-tr / .badge-corner / .badge-pill 等角标变体
// （修盲区 #1：broken-deck p5 的 badge 压 pin 曾漏检——badge 不在选择器里，G3 报 no overlaps）。
// 防误匹配大容器靠 test-label-overlap.js 的尺寸过滤（width>600 || height>120 排除）兜底。
const LABEL_SELECTOR = [
  '.pin',
  '.source',
  '.photo-credit',
  '.evidence-label',
  '.stamp',
  '.corner-mark',
  '.corner-tag',
  '[class~="kicker"]',
  '[class*="badge"]',
].join(', ');

module.exports = {
  LABEL_SELECTOR,
};
