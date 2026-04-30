# Requirements Document

## Introduction

A responsive, browser-based air quality monitoring dashboard that simulates realistic sensor readings for six indoor air quality metrics: CO2, CO, PM2.5, PM10, HCHO, and TVOC. The application is a prototype/demo — no real hardware or external APIs are required. All data is generated client-side via a simulation engine. The dashboard targets a broad audience including elderly adults, working adults, and teenagers, and must be fully usable on both mobile phones and desktop/laptop screens.

When first opened, the application presents a full-screen landing screen with a prominent "START" button. The monitoring dashboard and simulation only become active after the user clicks this button.

## Glossary

- **Dashboard**: The single-page web application that displays all air quality metrics.
- **Landing_Screen**: The initial full-screen view shown when the application first loads, containing the Start_Button and branding.
- **Start_Button**: A prominent call-to-action button on the Landing_Screen that the user clicks to begin the monitoring session.
- **Monitoring_View**: The main dashboard view containing all Metric_Cards, visible only after the user activates the Start_Button.
- **Simulator**: The client-side module responsible for generating and periodically updating mock sensor values.
- **Metric_Card**: A UI component that displays the current value, status label, and color indicator for one air quality metric.
- **Status_Label**: A human-readable classification of a metric's current value (e.g., "Good", "Moderate", "Unhealthy").
- **Threshold_Engine**: The module that maps a raw metric value to a Status_Label and corresponding color tier.
- **Color_Indicator**: A visual element (background, badge, or icon) that reflects the status tier — green (Good), yellow (Moderate), or red (Unhealthy).
- **Timestamp**: A display element showing the date and time of the most recent simulated data update.
- **Update_Interval**: The fixed period between successive Simulator ticks, set to 5 seconds.
- **CO2**: Carbon Dioxide, measured in parts per million (ppm).
- **CO**: Carbon Monoxide, measured in parts per million (ppm).
- **PM2.5**: Fine Particulate Matter, measured in micrograms per cubic metre (µg/m³).
- **PM10**: Coarse Particulate Matter, measured in micrograms per cubic metre (µg/m³).
- **HCHO**: Formaldehyde, measured in milligrams per cubic metre (mg/m³).
- **TVOC**: Total Volatile Organic Compounds, measured in parts per billion (ppb).

---

## Requirements

### Requirement 1: Metric Simulation

**User Story:** As a demo viewer, I want the dashboard to display continuously changing sensor values, so that the prototype feels realistic and live without requiring real hardware.

#### Acceptance Criteria

1. THE Simulator SHALL generate an initial value for each of the six metrics (CO2, CO, PM2.5, PM10, HCHO, TVOC) within the realistic indoor baseline ranges defined in Requirement 3.
2. WHEN the Update_Interval elapses, THE Simulator SHALL produce a new value for every metric by applying a small random delta to the previous value, keeping the result within the defined minimum and maximum bounds for that metric.
3. THE Simulator SHALL update all six metrics simultaneously on each tick so that the Timestamp reflects a single coherent reading.
4. IF a computed new value would fall below the defined minimum for a metric, THEN THE Simulator SHALL clamp the value to that minimum.
5. IF a computed new value would exceed the defined maximum for a metric, THEN THE Simulator SHALL clamp the value to that maximum.
6. THE Simulator SHALL use an Update_Interval of 5 seconds.

---

### Requirement 2: Metric Display

**User Story:** As a user, I want to see the current reading for each air quality metric on a dedicated card, so that I can quickly understand the air quality status at a glance.

#### Acceptance Criteria

1. THE Dashboard SHALL display one Metric_Card for each of the six metrics: CO2, CO, PM2.5, PM10, HCHO, and TVOC.
2. WHEN the Simulator produces a new value, THE Metric_Card SHALL update its displayed numeric value within 500 milliseconds.
3. THE Metric_Card SHALL display the metric's full name, its unit of measurement, the current numeric value, the Status_Label, and the Color_Indicator simultaneously.
4. THE Metric_Card SHALL display numeric values rounded to the precision appropriate for each metric: CO2 and CO to the nearest whole number (ppm), PM2.5 and PM10 to one decimal place (µg/m³), HCHO to two decimal places (mg/m³), and TVOC to the nearest whole number (ppb).
5. THE Dashboard SHALL display a Timestamp showing the date and time of the most recent Simulator tick, formatted as "Last updated: HH:MM:SS".

---

### Requirement 3: Status Classification

**User Story:** As a user, I want each metric to show a clear status label and color, so that I can immediately understand whether the air quality is safe without interpreting raw numbers.

#### Acceptance Criteria

1. THE Threshold_Engine SHALL classify each metric value into exactly one of three tiers: Good, Moderate, or Unhealthy, using the thresholds defined below.
2. WHEN a metric value is classified, THE Threshold_Engine SHALL assign the Color_Indicator green for Good, yellow for Moderate, and red for Unhealthy.
3. THE Threshold_Engine SHALL apply the following CO2 thresholds: Good when value ≤ 1000 ppm; Moderate when value > 1000 and ≤ 2000 ppm; Unhealthy when value > 2000 ppm.
4. THE Threshold_Engine SHALL apply the following CO thresholds: Good when value ≤ 9 ppm; Moderate when value > 9 and ≤ 35 ppm; Unhealthy when value > 35 ppm.
5. THE Threshold_Engine SHALL apply the following PM2.5 thresholds: Good when value ≤ 12.0 µg/m³; Moderate when value > 12.0 and ≤ 35.4 µg/m³; Unhealthy when value > 35.4 µg/m³.
6. THE Threshold_Engine SHALL apply the following PM10 thresholds: Good when value ≤ 54 µg/m³; Moderate when value > 54 and ≤ 154 µg/m³; Unhealthy when value > 154 µg/m³.
7. THE Threshold_Engine SHALL apply the following HCHO thresholds: Good when value ≤ 0.08 mg/m³; Moderate when value > 0.08 and ≤ 0.16 mg/m³; Unhealthy when value > 0.16 mg/m³.
8. THE Threshold_Engine SHALL apply the following TVOC thresholds: Good when value ≤ 220 ppb; Moderate when value > 220 and ≤ 660 ppb; Unhealthy when value > 660 ppb.
9. WHEN a Simulator tick updates a metric value, THE Threshold_Engine SHALL re-evaluate the classification and THE Metric_Card SHALL reflect any status change within 500 milliseconds.

---

### Requirement 4: Responsive Layout

**User Story:** As a user on any device, I want the dashboard to adapt its layout to my screen size, so that all metric cards are readable and usable whether I am on a phone or a laptop.

#### Acceptance Criteria

1. THE Dashboard SHALL render a single-column layout on viewports narrower than 640 px, displaying one Metric_Card per row.
2. THE Dashboard SHALL render a two-column grid layout on viewports between 640 px and 1023 px wide.
3. THE Dashboard SHALL render a three-column grid layout on viewports 1024 px wide and above.
4. THE Dashboard SHALL render all Metric_Card content without horizontal scrolling on any viewport width from 320 px to 2560 px.
5. THE Dashboard SHALL use a minimum body font size of 16 px and a minimum metric value font size of 32 px to ensure readability for elderly and adult users.

---

### Requirement 5: Visual Design and Accessibility

**User Story:** As a user, I want the dashboard to have a professional, modern appearance with clear contrast, so that it is easy to read and visually appealing across age groups.

#### Acceptance Criteria

1. THE Dashboard SHALL use a cohesive color palette with a contrast ratio of at least 4.5:1 between text and background for all body text, meeting WCAG 2.1 AA standards.
2. THE Dashboard SHALL use a distinctive typeface that is not Inter or Roboto, applied consistently across all text elements.
3. THE Dashboard SHALL apply smooth CSS transitions of 300 ms or less when a Metric_Card's Color_Indicator or Status_Label changes.
4. WHERE the browser supports CSS animations, THE Dashboard SHALL display a subtle pulse animation on a Metric_Card for 600 ms after its value is updated by the Simulator.
5. THE Dashboard SHALL use a card-based layout where each Metric_Card has visible separation (via shadow, border, or background contrast) from the page background.
6. THE Dashboard SHALL not use purple gradients or generic AI-aesthetic visual patterns; the design SHALL use a professional neutral theme (light or dark) with a distinctive, memorable visual identity.

---

### Requirement 6: Code Quality

**User Story:** As a developer reviewing the prototype, I want the source code to be clean, readable, and well-commented, so that I can understand and extend it easily.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented as a single HTML file with embedded or co-located CSS and JavaScript, requiring no build tools or server to run.
2. THE Simulator module SHALL be implemented as a clearly separated JavaScript section or file with inline comments explaining the simulation logic.
3. THE Threshold_Engine SHALL be implemented as a clearly separated JavaScript section or file with inline comments explaining each threshold boundary.
4. THE Dashboard source code SHALL include a comment block at the top of each logical section (HTML structure, CSS styles, Simulator, Threshold_Engine, rendering) describing its purpose.
5. WHEN a variable or function name is not self-explanatory, THE Dashboard source code SHALL include an inline comment explaining its purpose.

---

### Requirement 7: Landing Screen and Start Interaction

**User Story:** As a user opening the app for the first time, I want to see a welcoming landing screen with a clear start action, so that the experience feels intentional and I know how to begin monitoring.

#### Acceptance Criteria

1. WHEN the application first loads, THE Dashboard SHALL display the Landing_Screen and SHALL NOT display the Monitoring_View or any Metric_Cards.
2. THE Landing_Screen SHALL display a prominent Start_Button labelled "START" that is visually centered on the screen.
3. THE Landing_Screen SHALL display the application name or a brief descriptive title so the user understands the purpose of the app before starting.
4. WHEN the user clicks the Start_Button, THE Dashboard SHALL hide the Landing_Screen and reveal the Monitoring_View.
5. WHEN the user clicks the Start_Button, THE Simulator SHALL begin its first tick immediately, populating all Metric_Cards with initial values before the Monitoring_View becomes fully visible.
6. THE transition from Landing_Screen to Monitoring_View SHALL be animated (e.g., fade or slide) and SHALL complete within 600 milliseconds.
7. THE Start_Button SHALL be large enough to be easily tapped on a mobile touchscreen (minimum 48 × 48 px touch target) and SHALL meet the WCAG 2.1 AA contrast requirement against its background.
