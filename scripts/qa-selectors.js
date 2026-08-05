'use strict';

// Label-class + 角标元素：真正的索引/元数据/角标小元素。
// `[class*="pin"]` 覆盖 .pin / .pin-area / .pin-tr / .corner-pin 等变体（修盲区 #2：精确 .pin
// 漏检 .pin-area，e3-with 探针证实 broken-deck p5 的 .pin-area 压 badge 报假阴性 no overlaps；
// 与 test-color-role.js 的 [class*="pin"] 保持一致）。
// `[class*="badge"]` 覆盖 .badge / .badge-tr / .badge-corner / .badge-pill 等角标变体
// （修盲区 #1：broken-deck p5 的 badge 压 pin 曾漏检——badge 不在选择器里，G3 报 no overlaps）。
// 防误匹配大容器靠 test-label-overlap.js 的尺寸过滤（width>600 || height>120 排除）兜底。
const LABEL_SELECTOR = [
  '[class*="pin"]',
  '.source',
  '.photo-credit',
  '.evidence-label',
  '.stamp',
  '.seal',
  '.corner-mark',
  '.corner-tag',
  '[class~="kicker"]',
  '[class*="badge"]',
].join(', ');

module.exports = {
  LABEL_SELECTOR,
};
