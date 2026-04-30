// tests/lib.js
// Pure functions extracted from index.html for testability.
// index.html is a single-file browser app with no module system,
// so we duplicate the CONFIG, generateInitialValues, and tick
// functions here so they can be imported by the property tests.

export const CONFIG = {
  UPDATE_INTERVAL: 5000, // ms — how often the simulator ticks and cards refresh

  metrics: {
    co2: {
      name: 'Carbon Dioxide',
      unit: 'ppm',
      precision: 0,
      min: 400, max: 5000,
      baseline: { min: 400, max: 800 },
      delta: 50,
      thresholds: { good: 1000, moderate: 2000 },
    },
    co: {
      name: 'Carbon Monoxide',
      unit: 'ppm',
      precision: 0,
      min: 0, max: 100,
      baseline: { min: 0, max: 5 },
      delta: 2,
      thresholds: { good: 9, moderate: 35 },
    },
    pm25: {
      name: 'Fine Particulate Matter',
      unit: 'µg/m³',
      precision: 1,
      min: 0, max: 150,
      baseline: { min: 0, max: 10 },
      delta: 3,
      thresholds: { good: 12.0, moderate: 35.4 },
    },
    pm10: {
      name: 'Coarse Particulate Matter',
      unit: 'µg/m³',
      precision: 1,
      min: 0, max: 300,
      baseline: { min: 0, max: 40 },
      delta: 5,
      thresholds: { good: 54, moderate: 154 },
    },
    hcho: {
      name: 'Formaldehyde',
      unit: 'mg/m³',
      precision: 2,
      min: 0, max: 0.5,
      baseline: { min: 0, max: 0.05 },
      delta: 0.01,
      thresholds: { good: 0.08, moderate: 0.16 },
    },
    tvoc: {
      name: 'Total VOCs',
      unit: 'ppb',
      precision: 0,
      min: 0, max: 2000,
      baseline: { min: 0, max: 150 },
      delta: 30,
      thresholds: { good: 220, moderate: 660 },
    },
  },
};

/**
 * generateInitialValues()
 * Seeds every metric with a random starting value drawn uniformly
 * from its baseline range [baseline.min, baseline.max].
 *
 * @returns {SimulatorState}
 */
export function generateInitialValues() {
  const metrics = {};

  Object.keys(CONFIG.metrics).forEach(function (key) {
    const baseline = CONFIG.metrics[key].baseline;
    const value = baseline.min + Math.random() * (baseline.max - baseline.min);

    metrics[key] = {
      value: value,
      tier: '',
      label: '',
      color: '',
    };
  });

  return {
    metrics: metrics,
    lastUpdated: new Date(),
    running: false,
  };
}

/**
 * tick(currentState)
 * Advances every metric by one step of a symmetric random walk,
 * then clamps the result to the metric's absolute [min, max] bounds.
 * Returns a brand-new SimulatorState — currentState is never mutated.
 *
 * @param {SimulatorState} currentState
 * @returns {SimulatorState}
 */
export function tick(currentState) {
  const newMetrics = {};

  Object.keys(CONFIG.metrics).forEach(function (key) {
    const metric = CONFIG.metrics[key];
    const currentValue = currentState.metrics[key].value;

    // Random-walk step: scale a uniform (-1, 1) random value by delta
    const step = (Math.random() * 2 - 1) * metric.delta;
    let newValue = currentValue + step;

    // Clamp to [metric.min, metric.max]
    newValue = Math.max(metric.min, Math.min(metric.max, newValue));

    newMetrics[key] = {
      value: newValue,
      tier: currentState.metrics[key].tier,
      label: currentState.metrics[key].label,
      color: currentState.metrics[key].color,
    };
  });

  return {
    metrics: newMetrics,
    lastUpdated: new Date(),
    running: currentState.running,
  };
}

/**
 * classify(metricKey, value)
 *
 * Maps a numeric sensor reading to one of three health tiers by
 * comparing it against the thresholds defined in CONFIG.metrics.
 *
 * Tier boundaries (inclusive upper bounds):
 *   value <= thresholds.good     → Good      (#22c55e)
 *   value <= thresholds.moderate → Moderate  (#f59e0b)
 *   value >  thresholds.moderate → Unhealthy (#ef4444)
 *
 * @param {string} metricKey - Key into CONFIG.metrics (e.g. 'co2', 'pm25')
 * @param {number} value     - Current sensor reading for the metric
 * @returns {{ tier: string, label: string, color: string }}
 */
export function classify(metricKey, value) {
  // Guard: unknown metric key — warn and return a safe default so the
  // render loop never crashes due to a missing or misspelled key
  if (!CONFIG.metrics[metricKey]) {
    console.warn('classify: unknown metric key:', metricKey);
    return { tier: 'good', label: 'Good', color: '#22c55e' };
  }

  const thresholds = CONFIG.metrics[metricKey].thresholds;

  // Boundary 1: value at or below the Good upper bound → Good tier
  if (value <= thresholds.good) {
    return { tier: 'good', label: 'Good', color: '#22c55e' };
  }

  // Boundary 2: value at or below the Moderate upper bound → Moderate tier
  if (value <= thresholds.moderate) {
    return { tier: 'moderate', label: 'Moderate', color: '#f59e0b' };
  }

  // Boundary 3: value exceeds both thresholds → Unhealthy tier
  return { tier: 'unhealthy', label: 'Unhealthy', color: '#f04848' };
}

/**
 * formatValue(metricKey, value)
 *
 * Formats a numeric sensor reading to the correct number of decimal
 * places for the given metric, as defined by `CONFIG.metrics[metricKey].precision`.
 *
 * Precision per metric:
 *   co2, co, tvoc → 0 decimal places (whole number)
 *   pm25, pm10    → 1 decimal place
 *   hcho          → 2 decimal places
 *
 * @param {string} metricKey - Key into CONFIG.metrics (e.g. 'co2', 'pm25')
 * @param {number} value     - Numeric sensor reading to format
 * @returns {string} The formatted value string, or '0' if metricKey is unknown
 */
export function formatValue(metricKey, value) {
  // Guard: unknown metric key — warn and return a safe default so the
  // render loop never crashes due to a missing or misspelled key
  if (!CONFIG.metrics[metricKey]) {
    console.warn('formatValue: unknown metric key:', metricKey);
    return '0';
  }

  // Format to the precision specified for this metric in CONFIG
  return value.toFixed(CONFIG.metrics[metricKey].precision);
}

/**
 * renderCard(metricKey, metricState)
 *
 * Updates a single metric card in the DOM to reflect the current state
 * of the given metric. Selects the card by its `data-metric` attribute,
 * then updates the value, status label, and color indicator elements.
 * Finally, triggers the `card--pulse` CSS animation for 600 ms.
 *
 * @param {string} metricKey   - Key into CONFIG.metrics (e.g. 'co2', 'pm25')
 * @param {MetricState} metricState - Current state for the metric:
 *   { value: number, tier: string, label: string, color: string }
 */
export function renderCard(metricKey, metricState) {
  const card = document.querySelector('[data-metric="' + metricKey + '"]');
  if (!card) {
    console.warn('renderCard: no card element found for metric key:', metricKey);
    return;
  }

  const valueEl = card.querySelector('.card-value');
  if (valueEl) {
    valueEl.textContent = formatValue(metricKey, metricState.value);
  }

  const statusEl = card.querySelector('.card-status');
  if (statusEl) {
    statusEl.textContent = metricState.label;
  }

  const indicatorEl = card.querySelector('.card-indicator');
  if (indicatorEl) {
    indicatorEl.style.backgroundColor = metricState.color;
  }

  card.classList.add('card--pulse');
  setTimeout(function () {
    card.classList.remove('card--pulse');
  }, 600);
}

/**
 * formatTimestamp(date)
 *
 * Formats a Date object as a human-readable "Last updated: HH:MM:SS" string.
 * Each time component is zero-padded to exactly two digits so the output
 * width is always constant — e.g., midnight reads "Last updated: 00:00:00"
 * rather than "Last updated: 0:0:0".
 *
 * @param {Date} date - The Date object to format
 * @returns {string} A string of the form "Last updated: HH:MM:SS"
 */
export function formatTimestamp(date) {
  // Extract each time component and convert to string before padding;
  // String() is used explicitly so padStart() has a string to operate on.
  // padStart(2, '0') ensures single-digit values (e.g., 9) become "09".
  const hh = String(date.getHours()).padStart(2, '0');   // 0–23 → "00"–"23"
  const mm = String(date.getMinutes()).padStart(2, '0'); // 0–59 → "00"–"59"
  const ss = String(date.getSeconds()).padStart(2, '0'); // 0–59 → "00"–"59"
  return `Last updated: ${hh}:${mm}:${ss}`;
}
