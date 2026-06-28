'use strict';

const LABEL_SELECTOR = [
  '.pin',
  '.source',
  '.photo-credit',
  '.evidence-label',
  '.stamp',
  '.corner-mark',
  '.corner-tag',
  '[class~="kicker"]',
].join(', ');

module.exports = {
  LABEL_SELECTOR,
};
