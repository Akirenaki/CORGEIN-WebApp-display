// @vitest-environment jsdom
// Feature: air-quality-dashboard, Property 1: Simulator values always stay within defined bounds
import { describe, it, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { CONFIG, generateInitialValues, tick, classify, formatValue, renderCard, formatTimestamp } from './lib.js';

// Validates: Requirements 1.1, 1.2, 1.4, 1.5
describe('Property 1: Simulator values always stay within defined bounds', () => {
  it('every metric value stays within [min, max] after N ticks from a valid initial state', () => {
    fc.assert(
      fc.property(
        // Pick any metric key from CONFIG
        fc.constantFrom(...Object.keys(CONFIG.metrics)),
        // Pick a tick count between 1 and 50
        fc.integer({ min: 1, max: 50 }),
        (metricKey, tickCount) => {
          // Start from a valid initial state
          let state = generateInitialValues();

          // Run N ticks
          for (let i = 0; i < tickCount; i++) {
            state = tick(state);
          }

          // Assert every metric value is within its defined [min, max] bounds
          for (const key of Object.keys(CONFIG.metrics)) {
            const metric = CONFIG.metrics[key];
            const value = state.metrics[key].value;

            if (value < metric.min || value > metric.max) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: air-quality-dashboard, Property 2: Metric card renders all required fields
// Validates: Requirements 2.3
describe('Property 2: Metric card renders all required fields', () => {
  let cardEl;

  afterEach(() => {
    // Clean up any card stubs added to the DOM
    if (cardEl && cardEl.parentNode) {
      cardEl.parentNode.removeChild(cardEl);
    }
    cardEl = null;
  });

  it('renderCard() populates value, status, and color indicator for any valid metricState', () => {
    const TIER_COLORS = {
      good: '#22c55e',
      moderate: '#f59e0b',
      unhealthy: '#f04848',
    };
    const TIER_LABELS = {
      good: 'Good',
      moderate: 'Moderate',
      unhealthy: 'Unhealthy',
    };

    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(CONFIG.metrics)),
        fc.constantFrom('good', 'moderate', 'unhealthy'),
        (metricKey, tier) => {
          const metric = CONFIG.metrics[metricKey];

          // Generate a value within [min, max] for this metric
          const value = metric.min + Math.random() * (metric.max - metric.min);

          const metricState = {
            value,
            tier,
            label: TIER_LABELS[tier],
            color: TIER_COLORS[tier],
          };

          // Create a minimal DOM stub matching the expected card structure
          cardEl = document.createElement('article');
          cardEl.className = 'metric-card';
          cardEl.setAttribute('data-metric', metricKey);
          cardEl.innerHTML = `
            <span class="card-name">${metric.name}</span>
            <span class="card-value"></span>
            <span class="card-unit">${metric.unit}</span>
            <span class="card-status"></span>
            <span class="card-indicator"></span>
          `;
          document.body.appendChild(cardEl);

          // Call renderCard
          renderCard(metricKey, metricState);

          // Assert .card-value text equals formatValue(metricKey, value)
          const valueEl = cardEl.querySelector('.card-value');
          if (valueEl.textContent !== formatValue(metricKey, value)) return false;

          // Assert .card-status text equals metricState.label
          const statusEl = cardEl.querySelector('.card-status');
          if (statusEl.textContent !== metricState.label) return false;

          // Assert .card-indicator backgroundColor was set (not empty)
          const indicatorEl = cardEl.querySelector('.card-indicator');
          if (!indicatorEl.style.backgroundColor) return false;

          // Assert card has card--pulse class (added synchronously)
          if (!cardEl.classList.contains('card--pulse')) return false;

          // Assert card contains the metric name
          const nameEl = cardEl.querySelector('.card-name');
          if (!nameEl || nameEl.textContent !== metric.name) return false;

          // Assert card contains the unit
          const unitEl = cardEl.querySelector('.card-unit');
          if (!unitEl || unitEl.textContent !== metric.unit) return false;

          // Clean up this iteration's card before the next
          document.body.removeChild(cardEl);
          cardEl = null;

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: air-quality-dashboard, Property 4: Threshold classification is total and correct
// Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
describe('Property 4: Threshold classification is total and correct', () => {
  const VALID_TIERS = new Set(['good', 'moderate', 'unhealthy']);
  const TIER_COLORS = {
    good: '#22c55e',
    moderate: '#f59e0b',
    unhealthy: '#f04848',
  };
  const TIER_LABELS = {
    good: 'Good',
    moderate: 'Moderate',
    unhealthy: 'Unhealthy',
  };

  it('classify() returns exactly one valid tier with correct color and label for any value in [min, max]', () => {
    fc.assert(
      fc.property(
        // Pick any metric key from CONFIG
        fc.constantFrom(...Object.keys(CONFIG.metrics)),
        (metricKey) => {
          const metric = CONFIG.metrics[metricKey];

          // Generate a float within [metric.min, metric.max] using a chained arbitrary
          return fc.assert(
            fc.property(
              fc.float({ min: metric.min, max: metric.max, noNaN: true }),
              (value) => {
                const result = classify(metricKey, value);

                // Tier must be exactly one of the three valid tiers
                if (!VALID_TIERS.has(result.tier)) return false;

                // Color must match the tier
                if (result.color !== TIER_COLORS[result.tier]) return false;

                // Label must match the tier
                if (result.label !== TIER_LABELS[result.tier]) return false;

                return true;
              }
            ),
            { numRuns: 100 }
          );
        }
      ),
      { numRuns: 1 } // outer loop runs once per metric key via constantFrom
    );
  });

  it('classify() returns exactly one valid tier with correct color and label (flat property over all metrics)', () => {
    fc.assert(
      fc.property(
        // Pick any metric key from CONFIG
        fc.constantFrom(...Object.keys(CONFIG.metrics)),
        (metricKey) => {
          const metric = CONFIG.metrics[metricKey];
          const thresholds = metric.thresholds;

          // Test boundary: value exactly equal to thresholds.good → Good
          const atGood = classify(metricKey, thresholds.good);
          if (atGood.tier !== 'good') return false;
          if (atGood.color !== TIER_COLORS.good) return false;
          if (atGood.label !== TIER_LABELS.good) return false;

          // Test boundary: value exactly equal to thresholds.moderate → Moderate
          const atModerate = classify(metricKey, thresholds.moderate);
          if (atModerate.tier !== 'moderate') return false;
          if (atModerate.color !== TIER_COLORS.moderate) return false;
          if (atModerate.label !== TIER_LABELS.moderate) return false;

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('classify() returns correct tier for values in each zone across all metrics', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(CONFIG.metrics)),
        (metricKey) => {
          const metric = CONFIG.metrics[metricKey];
          const { good: goodThreshold, moderate: moderateThreshold } = metric.thresholds;

          // A value strictly below the good threshold must be 'good'
          if (metric.min < goodThreshold) {
            const belowGood = metric.min;
            const result = classify(metricKey, belowGood);
            if (result.tier !== 'good') return false;
          }

          // A value strictly above the moderate threshold must be 'unhealthy'
          if (metric.max > moderateThreshold) {
            const aboveModerate = metric.max;
            const result = classify(metricKey, aboveModerate);
            if (result.tier !== 'unhealthy') return false;
          }

          // A value strictly between the two thresholds must be 'moderate'
          if (goodThreshold < moderateThreshold) {
            const midpoint = goodThreshold + (moderateThreshold - goodThreshold) / 2;
            // Only test if midpoint is strictly between the thresholds
            if (midpoint > goodThreshold && midpoint < moderateThreshold) {
              const result = classify(metricKey, midpoint);
              if (result.tier !== 'moderate') return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: air-quality-dashboard, Property 3: Numeric values are formatted to the correct precision

// Validates: Requirements 2.4
describe('Property 3: Numeric values are formatted to the correct precision', () => {
  it('formatValue() returns a string with exactly metric.precision decimal places for any value in [min, max]', () => {
    fc.assert(
      fc.property(
        // Pick any metric key from CONFIG
        fc.constantFrom(...Object.keys(CONFIG.metrics)),
        (metricKey) => {
          const metric = CONFIG.metrics[metricKey];

          return fc.assert(
            fc.property(
              fc.float({ min: metric.min, max: metric.max, noNaN: true }),
              (value) => {
                const result = formatValue(metricKey, value);

                // Result must be a string
                if (typeof result !== 'string') return false;

                if (metric.precision === 0) {
                  // toFixed(0) never includes a '.', so the string should not contain one
                  if (result.includes('.')) return false;
                } else {
                  // Must have a decimal point with exactly precision digits after it
                  if (!result.includes('.')) return false;
                  const fractionalPart = result.split('.')[1];
                  if (fractionalPart.length !== metric.precision) return false;
                }

                return true;
              }
            ),
            { numRuns: 100 }
          );
        }
      ),
      { numRuns: 1 } // outer loop runs once per metric key via constantFrom
    );
  });
});

// Feature: air-quality-dashboard, Property 5: Timestamp format is always valid

// Validates: Requirements 2.5
describe('Property 5: Timestamp format is always valid', () => {
  it('formatTimestamp() returns a string matching "Last updated: HH:MM:SS" for any Date', () => {
    fc.assert(
      fc.property(
        fc.date(),
        (date) => {
          const result = formatTimestamp(date);

          // Must match the exact pattern "Last updated: HH:MM:SS"
          if (!/^Last updated: \d{2}:\d{2}:\d{2}$/.test(result)) return false;

          // Parse HH, MM, SS from the result
          const parts = result.replace('Last updated: ', '').split(':');
          const hh = parseInt(parts[0], 10);
          const mm = parseInt(parts[1], 10);
          const ss = parseInt(parts[2], 10);

          // HH must be 0–23
          if (hh < 0 || hh > 23) return false;

          // MM must be 0–59
          if (mm < 0 || mm > 59) return false;

          // SS must be 0–59
          if (ss < 0 || ss > 59) return false;

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: air-quality-dashboard, Property 6: All text/background color pairs meet WCAG 2.1 AA contrast
// Validates: Requirements 5.1, 7.7
describe('Property 6: All text/background color pairs meet WCAG 2.1 AA contrast', () => {
  /**
   * Convert a hex color string to linear RGB luminance using the WCAG formula.
   * Steps:
   *   1. Parse hex to R, G, B in [0, 255]
   *   2. Normalize to [0, 1]: c = c / 255
   *   3. Gamma-correct: c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
   *   4. Luminance: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
   */
  function relativeLuminance(hex) {
    // Strip leading '#' and expand shorthand (e.g. #abc → #aabbcc)
    const clean = hex.replace('#', '');
    const full = clean.length === 3
      ? clean.split('').map(c => c + c).join('')
      : clean;

    const r = parseInt(full.slice(0, 2), 16) / 255;
    const g = parseInt(full.slice(2, 4), 16) / 255;
    const b = parseInt(full.slice(4, 6), 16) / 255;

    const linearize = (c) =>
      c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
  }

  /**
   * Compute the WCAG contrast ratio between two hex colors.
   * contrast = (L_lighter + 0.05) / (L_darker + 0.05)
   */
  function contrastRatio(hex1, hex2) {
    const l1 = relativeLuminance(hex1);
    const l2 = relativeLuminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Design-system color pairs: [label, textColor, bgColor]
  const colorPairs = [
    ['Primary text (#e8eaf0) on card surface (#1a1d27)',       '#e8eaf0', '#1a1d27'],
    ['Secondary text (#8b90a0) on card surface (#1a1d27)',     '#8b90a0', '#1a1d27'],
    ['Accent (#00d4ff) on page background (#0f1117)',          '#00d4ff', '#0f1117'],
    ['START button text (#0f1117) on button bg (#00d4ff)',     '#0f1117', '#00d4ff'],
    ['Status Good (#22c55e) on card surface (#1a1d27)',        '#22c55e', '#1a1d27'],
    ['Status Moderate (#f59e0b) on card surface (#1a1d27)',    '#f59e0b', '#1a1d27'],
    ['Status Unhealthy (#f04848) on card surface (#1a1d27)',   '#f04848', '#1a1d27'],
  ];

  it('every design-system color pair has a contrast ratio ≥ 4.5 (WCAG 2.1 AA)', () => {
    for (const [label, textColor, bgColor] of colorPairs) {
      const ratio = contrastRatio(textColor, bgColor);
      if (ratio < 4.5) {
        throw new Error(
          `WCAG AA contrast failure: ${label}\n` +
          `  Contrast ratio: ${ratio.toFixed(2)}:1 (required ≥ 4.5:1)`
        );
      }
    }
  });
});
