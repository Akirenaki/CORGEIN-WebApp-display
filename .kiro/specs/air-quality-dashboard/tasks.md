# Implementation Plan: Air Quality Dashboard

## Overview

Implement a self-contained single-file (`index.html`) air quality monitoring dashboard with a landing screen, six simulated metric cards, threshold classification, responsive layout, and a dark industrial aesthetic. The implementation proceeds in layers: scaffold → config → logic modules → rendering → HTML/CSS structure → visual design → controller → animations → accessibility → tests.

## Tasks

- [x] 1. Scaffold the single HTML file with section stubs
  - Create `index.html` with `<!DOCTYPE html>`, `<head>` (charset, viewport, Google Fonts link for Space Grotesk and JetBrains Mono), an empty `<style>` block, a `<body>` containing `#landing` and `#dashboard` divs (both empty for now), and an empty `<script>` block
  - Add comment-block headers inside `<style>` and `<script>` for each logical section: CSS Design Tokens, CSS Layout, CSS Components, CSS Animations, CONFIG, SIMULATOR, THRESHOLD ENGINE, RENDERER, CONTROLLER
  - Verify the file opens in a browser without errors
  - _Requirements: 6.1, 6.4_

- [x] 2. Implement the CONFIG section
  - [x] 2.1 Write the CONFIG constant with all metric definitions and the update interval
    - Define `CONFIG.UPDATE_INTERVAL = 5000`
    - Define `CONFIG.metrics` with entries for `co2`, `co`, `pm25`, `pm10`, `hcho`, `tvoc` — each containing `name`, `unit`, `precision`, `min`, `max`, `baseline.min`, `baseline.max`, `delta`, `thresholds.good`, `thresholds.moderate` exactly as specified in the design document
    - Add inline comments on each field explaining its purpose
    - _Requirements: 1.2, 1.4, 1.5, 1.6, 2.4, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 6.2, 6.3_

- [x] 3. Implement the SIMULATOR module
  - [x] 3.1 Implement `generateInitialValues()`
    - For each metric key in `CONFIG.metrics`, generate a random value uniformly within `[baseline.min, baseline.max]`
    - Return a `SimulatorState` object with `metrics` (each entry has `value`, `tier`, `label`, `color` set to placeholder strings for now), `lastUpdated: new Date()`, `running: false`
    - Add inline comments explaining the baseline range logic
    - _Requirements: 1.1, 1.3_
  - [x] 3.2 Implement `tick(currentState)`
    - For each metric, compute `newValue = currentValue + (Math.random() * 2 - 1) * delta`
    - Clamp: `newValue = Math.max(metric.min, Math.min(metric.max, newValue))`
    - Return a new state object (do not mutate `currentState`) with updated values and `lastUpdated: new Date()`
    - Add inline comments on the random-walk formula and clamping
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 6.2_
  - [x] 3.3 Write property test for simulator bounds (Property 1)
    - **Property 1: Simulator values always stay within defined bounds**
    - Use `fc.constantFrom(...Object.keys(CONFIG.metrics))` and `fc.integer()` for tick count (1–50)
    - Start from a valid initial state and run N ticks; assert every value is within `[min, max]` for its metric
    - Tag: `// Feature: air-quality-dashboard, Property 1: Simulator values always stay within defined bounds`
    - **Validates: Requirements 1.1, 1.2, 1.4, 1.5**

- [x] 4. Implement the THRESHOLD ENGINE module
  - [x] 4.1 Implement `classify(metricKey, value)`
    - Look up `CONFIG.metrics[metricKey].thresholds`
    - Return `{ tier: 'good', label: 'Good', color: '#22c55e' }` when `value <= thresholds.good`
    - Return `{ tier: 'moderate', label: 'Moderate', color: '#f59e0b' }` when `value <= thresholds.moderate`
    - Return `{ tier: 'unhealthy', label: 'Unhealthy', color: '#f04848' }` otherwise
    - Handle unknown `metricKey` with a `console.warn` and safe default return
    - Add inline comments on each threshold boundary
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 6.3_
  - [x] 4.2 Write property test for threshold classification (Property 4)
    - **Property 4: Threshold classification is total and correct**
    - For each metric, generate `fc.float({ min: metric.min, max: metric.max })` and assert `classify()` returns exactly one of `{good, moderate, unhealthy}` with the correct hex color
    - Assert boundary values: value exactly equal to `thresholds.good` → Good; value exactly equal to `thresholds.moderate` → Moderate
    - Tag: `// Feature: air-quality-dashboard, Property 4: Threshold classification is total and correct`
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

- [x] 5. Checkpoint — Ensure CONFIG, SIMULATOR, and THRESHOLD ENGINE are correct
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement the RENDERER module
  - [x] 6.1 Implement `formatValue(metricKey, value)`
    - Use `value.toFixed(CONFIG.metrics[metricKey].precision)` to format to the correct decimal places
    - Handle unknown `metricKey` with a `console.warn` and return `'0'`
    - _Requirements: 2.4_
  - [x] 6.2 Write property test for numeric precision (Property 3)
    - **Property 3: Numeric values are formatted to the correct precision**
    - For each metric, generate `fc.float({ min: metric.min, max: metric.max })` and assert the returned string has exactly `metric.precision` decimal places
    - Tag: `// Feature: air-quality-dashboard, Property 3: Numeric values are formatted to the correct precision`
    - **Validates: Requirements 2.4**
  - [x] 6.3 Implement `formatTimestamp(date)`
    - Extract hours, minutes, seconds from the `Date` object; zero-pad each to two digits
    - Return `"Last updated: HH:MM:SS"`
    - _Requirements: 2.5_
  - [x] 6.4 Write property test for timestamp format (Property 5)
    - **Property 5: Timestamp format is always valid**
    - Use `fc.date()` and assert the returned string matches `/^Last updated: \d{2}:\d{2}:\d{2}$/`
    - Assert HH is 00–23, MM is 00–59, SS is 00–59
    - Tag: `// Feature: air-quality-dashboard, Property 5: Timestamp format is always valid`
    - **Validates: Requirements 2.5**
  - [x] 6.5 Implement `renderCard(metricKey, metricState)`
    - Select the card element by `data-metric` attribute
    - Update the value element's text content using `formatValue()`
    - Update the status label element's text content with `metricState.label`
    - Update the color indicator element's background/border color with `metricState.color`
    - Add CSS class `card--pulse` to the card; remove it after 600 ms via `setTimeout`
    - _Requirements: 2.2, 2.3, 3.9, 5.3, 5.4_
  - [x] 6.6 Write property test for card rendering (Property 2)
    - **Property 2: Metric card renders all required fields**
    - For each metric key and a generated valid `metricState`, call `renderCard()` against a minimal DOM stub and assert the card HTML contains the metric name, unit, formatted value, status label, and a color indicator element with the correct color
    - Tag: `// Feature: air-quality-dashboard, Property 2: Metric card renders all required fields`
    - **Validates: Requirements 2.3**
  - [x] 6.7 Implement `renderAll(state)`
    - Iterate over all six metric keys and call `renderCard()` for each
    - Call `formatTimestamp(state.lastUpdated)` and update the timestamp element's text content
    - _Requirements: 2.1, 2.2, 2.5, 3.9_

- [x] 7. Build the HTML structure for Landing Screen and Monitoring View
  - [x] 7.1 Write the Landing Screen HTML inside `#landing`
    - Add an `<h1>` with the application title (e.g., "Air Quality Monitor")
    - Add a brief descriptive subtitle so the user understands the app's purpose
    - Add a `<button id="start-btn">START</button>` that is visually centered
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 7.2 Write the Monitoring View HTML inside `#dashboard`
    - Add a `<header>` with the app title and a `<span id="timestamp">` element
    - Add a `<main>` containing a `<div class="card-grid">` with six `<article class="metric-card" data-metric="co2|co|pm25|pm10|hcho|tvoc">` elements
    - Inside each card: a `.card-name` element, a `.card-value` element, a `.card-unit` element, a `.card-status` element (for the Status_Label), and a `.card-indicator` element (for the Color_Indicator)
    - _Requirements: 2.1, 2.3, 2.5_

- [x] 8. Implement Landing Screen CSS
  - [x] 8.1 Write CSS for the landing screen layout
    - `#landing`: `position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center`
    - Background: `#0f1117`; primary text color: `#e8eaf0`
    - Apply Space Grotesk to the title; set font size ≥ 16 px for body text
    - _Requirements: 4.5, 5.1, 5.2, 7.1, 7.2_
  - [x] 8.2 Write CSS for the START button
    - Minimum size `48px × 48px` touch target; padding to ensure comfortable tap area
    - Background: `#00d4ff`; text color: `#0f1117` (verify contrast ≥ 4.5:1)
    - Font: Space Grotesk, bold; font size ≥ 16 px
    - Rounded corners, no border; cursor: pointer
    - _Requirements: 5.1, 7.2, 7.7_

- [x] 9. Implement Monitoring View CSS
  - [x] 9.1 Write CSS design tokens as custom properties
    - Define `--bg`, `--card-bg`, `--card-border`, `--text-primary`, `--text-secondary`, `--accent`, `--good`, `--moderate`, `--unhealthy` using the palette values from the design document
    - _Requirements: 5.1, 5.6_
  - [x] 9.2 Write CSS for the responsive card grid
    - Default (mobile-first): single column, `grid-template-columns: 1fr`
    - `@media (min-width: 640px)`: two columns
    - `@media (min-width: 1024px)`: three columns
    - No horizontal overflow; `max-width: 100%; overflow-x: hidden` on body
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 9.3 Write CSS for the Metric_Card component
    - Background: `var(--card-bg)`; border: `1px solid var(--card-border)`; box-shadow for visible separation
    - Padding, border-radius, and gap between cards
    - `.card-value`: font-family JetBrains Mono; font-size ≥ 32 px
    - `.card-name`, `.card-unit`, `.card-status`: font-family Space Grotesk; font-size ≥ 16 px
    - `.card-indicator`: a colored badge/dot that receives inline `background-color` from the renderer
    - _Requirements: 2.3, 4.5, 5.2, 5.5_

- [x] 10. Implement visual design details
  - [x] 10.1 Apply the full dark industrial color palette
    - Set `body { background: var(--bg); color: var(--text-primary); }`
    - Apply `var(--text-secondary)` to labels and units
    - Apply `var(--accent)` to the START button and any active indicators
    - Verify all text/background pairs in the rendered page meet 4.5:1 contrast (primary text `#e8eaf0` on card `#1a1d27`, secondary text `#8b90a0` on card `#1a1d27`, START button `#0f1117` on `#00d4ff`)
    - _Requirements: 5.1, 5.6_
  - [x] 10.2 Write property test for WCAG contrast (Property 6)
    - **Property 6: All text/background color pairs meet WCAG 2.1 AA contrast**
    - Enumerate all design-system color pairs: primary text / card surface, secondary text / card surface, accent text / page background, START button text / button background, status Good/Moderate/Unhealthy labels / card surface
    - Implement a `contrastRatio(hex1, hex2)` helper using the WCAG relative luminance formula
    - Assert each pair has contrast ratio ≥ 4.5
    - Tag: `// Feature: air-quality-dashboard, Property 6: All text/background color pairs meet WCAG 2.1 AA contrast`
    - **Validates: Requirements 5.1, 7.7**

- [x] 11. Implement the Landing Screen Controller
  - [x] 11.1 Implement `startDashboard()`
    - Call `generateInitialValues()`, then for each metric call `classify()` to populate `tier`, `label`, `color` on the state
    - Call `renderAll(state)` to populate all six cards before the transition begins
    - Add CSS class `is-transitioning` to `#landing` to trigger the fade-out animation
    - After 600 ms (`setTimeout`), set `#landing` to `display: none` and `#dashboard` to visible
    - Check `typeof setInterval === 'function'`; if true, start `setInterval(() => { state = tick(state); Object.keys(state.metrics).forEach(k => { state.metrics[k] = { ...state.metrics[k], ...classify(k, state.metrics[k].value) }; }); renderAll(state); }, CONFIG.UPDATE_INTERVAL)`
    - Set `state.running = true`
    - _Requirements: 7.1, 7.4, 7.5, 7.6, 1.6_
  - [x] 11.2 Attach the click handler to the START button
    - `document.getElementById('start-btn').addEventListener('click', startDashboard)`
    - Ensure `#dashboard` has `display: none` on initial load and `#landing` is visible
    - _Requirements: 7.1, 7.4_

- [x] 12. Implement animations and transitions
  - [x] 12.1 Write the `card--pulse` CSS animation
    - Define `@keyframes pulse` that briefly brightens or scales the card (e.g., `box-shadow` or `opacity` shift) over 600 ms
    - `.card--pulse { animation: pulse 600ms ease-out; }`
    - _Requirements: 5.3, 5.4_
  - [x] 12.2 Write the landing-to-dashboard fade transition
    - `#landing.is-transitioning { animation: fadeOut 600ms forwards; }`
    - Define `@keyframes fadeOut` from `opacity: 1` to `opacity: 0`
    - _Requirements: 7.6_
  - [x] 12.3 Add `prefers-reduced-motion` support
    - `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`
    - This disables both the pulse and the fade transition for users who have requested reduced motion
    - _Requirements: 5.3, 5.4_

- [x] 13. Checkpoint — Verify full application flow in browser
  - Ensure all tests pass, ask the user if questions arise.
  - Open `index.html` in a browser; confirm landing screen appears, START button is centered and styled, clicking START populates all six cards and transitions to the monitoring view, cards update every 5 seconds with pulse animation, and the timestamp updates on each tick.

- [x] 14. Accessibility hardening
  - [x] 14.1 Add ARIA attributes and semantic markup
    - Add `role="main"` to the monitoring view's `<main>` element (or use the semantic element directly)
    - Add `aria-label` to each `.metric-card` describing the metric (e.g., `aria-label="Carbon Dioxide metric card"`)
    - Add `aria-live="polite"` to the timestamp element so screen readers announce updates
    - Ensure the START button has a visible focus ring (`:focus-visible` outline in CSS)
    - _Requirements: 5.1, 7.7_
  - [x] 14.2 Verify touch target and font size minimums
    - Confirm START button computed size is ≥ 48 × 48 px (inspect in browser DevTools)
    - Confirm body font size is ≥ 16 px and metric value font size is ≥ 32 px (inspect computed styles)
    - _Requirements: 4.5, 7.7_

- [x] 15. Write and run the fast-check property-based test suite
  - [x] 15.1 Set up the test file
    - Create `tests/properties.test.js` (or a test HTML file if using CDN fast-check)
    - Import or load fast-check; import the pure functions `classify`, `formatValue`, `formatTimestamp`, and the simulator functions from `index.html` (extract them to a shared module or duplicate for testing)
    - Configure `numRuns: 100` for all properties
    - _Requirements: 6.1_
  - [x] 15.2 Run all six property tests and confirm they pass
    - Execute the test suite; all six properties (Property 1–6) must pass with 0 counterexamples
    - Fix any failures before proceeding
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 5.1, 7.7_

- [x] 16. Final checkpoint — Complete implementation review
  - Ensure all tests pass, ask the user if questions arise.
  - Verify the single `index.html` file opens without a server, all six metric cards display and update, the responsive layout works at 320 px and 1440 px viewport widths, and no horizontal scrolling occurs.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints at tasks 5, 13, and 16 ensure incremental validation
- Property tests (Properties 1–6) validate universal correctness guarantees; unit tests validate specific examples
- The entire application is a single `index.html` file — no build tools, no server, no external runtime dependencies beyond the Google Fonts stylesheet
