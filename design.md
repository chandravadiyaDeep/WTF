# NUMPA — Interface Design Reference

## 1. Purpose and source

This document defines a lasting, implementation-ready visual direction for NUMPA's data preparation and ML readiness workflow. It uses the referenced Dribbble project for high-level principles, then proposes an original NUMPA interface. It is not a reproduction of the reference artwork.

- Reference: [Urban Sound Dashboard](https://dribbble.com/shots/26960624-Urban-Sound-Dashboard)
- Designer attribution: Layo
- Reference page description: real-time commerce analytics for store owners/managers, focused on key metrics, trends, segments, time ranges, scannability and actionable information.
- Audience for NUMPA: freelance data analysts preparing datasets and assessing their readiness for ML.

## 2. Reference summary and design objectives

The reference page describes a dark analytics dashboard that puts critical business metrics first and supports deeper analysis through trends, segments and time filters. Its stated UX goal is to make complex data intuitive, scannable and actionable. Its visual intent is to use dark surfaces and contrast/accent colors to emphasize visualizations during frequent use.

NUMPA should carry forward these principles:

1. Put the current dataset and next useful action first.
2. Let users understand the state at a glance, then inspect evidence.
3. Treat analysis, cleaning and readiness as a connected workflow.
4. Use restrained accents to distinguish key actions and signals.
5. Keep uncertainty visible; do not imply an ML readiness score guarantees model performance.

NUMPA should not carry over commerce concepts such as revenue, orders, store health or customer retention.

## 3. Verified observations versus recommendations

| Statement | Evidence class |
|---|---|
| The page is titled Urban Sound Dashboard and credits Layo. | Verified page metadata |
| The reference is described as real-time commerce analytics for store owners and managers. | Verified page description |
| The description mentions key metrics, trends, segments and time-based filters. | Verified page description |
| The author says the interface prioritizes critical business metrics, uses visual hierarchy, and chose a dark theme to emphasize data visualization with contrast/accent colors. | Verified design-process text |
| The published palette contains the six exact hex values listed in Section 4. | Verified page palette |
| Exact dashboard component arrangement, chart types, typeface, sizing, spacing, card shape, navigation, animations, hover behavior and detailed color assignments. | Not verified; shot image fetch was unavailable for visual inspection |
| The proposed NUMPA colors, layout, components, type scale, spacing, states and screen compositions below. | NUMPA design recommendations, not claims about Layo's original design |

The Dribbble page text and palette were available, but the actual shot image could not be inspected: the image preview request returned a cache miss. Therefore this document does not assert unverified screenshot details.

## 4. Original published color palette

These six values are transcribed exactly from the reference page. The suggested roles are NUMPA recommendations only.

| Published color | Proposed NUMPA role | Usage guidance |
|---|---|---|
| #050505 | Primary canvas | Main dark application background; use with a raised surface so panels remain distinguishable. |
| #D9D4D4 | Core light neutral | Primary text on dark surfaces; selected icon/label; light foreground on accent surfaces. |
| #575359 | Muted neutral | Decorative separators or text on light neutral surfaces. Avoid small text on dark backgrounds; contrast is too low. |
| #F92D03 | Warm attention accent | Use sparingly for an issue needing attention, a changed-value cue, or a high-priority alert. Do not use color alone to mean destructive or error. |
| #2F27F5 | Indigo accent | Selected navigation, focus/selection accent, or primary action background with light text. Avoid indigo text directly on near-black; contrast is insufficient. |
| #57B970 | Positive accent | Completed/healthy state and positive change, always paired with a label/icon and evidence. |

The source page publishes colors, not a per-component mapping. None of these proposed assignments should be attributed to the original designer.

### Contrast guidance

Use WCAG 2.2 AA as the implementation target: text normally needs at least 4.5:1 contrast, with 3:1 for qualifying large text. Ratios below are calculated for the listed solid colors; final UI combinations must be checked after surfaces, opacity and typography are applied. See [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

| Foreground / background | Approx. ratio | Recommendation |
|---|---:|---|
| #D9D4D4 / #050505 | 13.90:1 | Strong primary text pairing |
| #D9D4D4 / #101012 | 12.96:1 | Strong text on raised surface |
| #F4F1F1 / #2F27F5 | 6.85:1 | Accessible light label on indigo action |
| #D9D4D4 / #2F27F5 | 5.25:1 | Accessible light label on indigo action |
| #F92D03 / #050505 | 5.25:1 | Suitable for text/icon attention accent, verify context |
| #57B970 / #050505 | 8.33:1 | Strong positive text/icon accent |
| #575359 / #050505 | 2.65:1 | Do not use for ordinary text |
| #2F27F5 / #050505 | 2.65:1 | Do not use as small text or sole focus indicator |

Recommended additional NUMPA neutrals (not in the reference): canvas #09090B; surface-1 #101012; surface-2 #17171B; surface-3 #202025; divider #34343B; primary text #F4F1F1; secondary text #C2BEC2. Verify all combinations for actual component states.

## 5. Visual style and principles

**Personality:** capable, calm, precise and encouraging. NUMPA should feel like a trustworthy analyst’s workspace, not a game, a trading terminal or a marketing landing page.

- Use a dark neutral canvas and a small number of distinct surface levels. Separate panels with tonal steps and thin borders before relying on shadows.
- Keep a clear page title, dataset/version context, primary action and one concise summary at the top.
- Pair every score or issue count with a label and a path to its evidence.
- Use the orange, indigo and green palette accents as semantic highlights, not as large competing blocks.
- Use plain-language summaries first; place advanced settings, definitions and provenance in expandable detail.
- Preserve generous spacing around charts and decisions. Data tables may be dense, but maintain clear row separation and readable headers.
- Avoid decorative gradients, glow, glass effects and motion unless a later prototype demonstrates a functional benefit. These are not verified reference attributes.

## 6. Layout and information hierarchy

### Application shell

Recommended desktop layout:

1. Persistent left navigation for Home, Analysis, Cleaning, Visualization, ML Readiness, Models/Results and Settings.
2. Header with workspace, dataset/version selector, processing status and account actions.
3. Main content column with page title, short explanation, primary action and evidence-first content.
4. Optional right-side contextual panel for evidence/help/operation settings on wide screens; collapse it into a drawer on smaller screens.

Navigation should reflect the current workflow stage, with a clear active state. A workflow stepper may show Upload → Analyze → Clean → Recheck readiness → Compare → Export, but must distinguish completed, current, blocked and optional steps.

### Page content order

Use this general sequence where appropriate: identity/context → summary → actionable finding or next step → supporting evidence → details/history. Do not make users scan multiple decorative cards to find the dataset state or primary action.

## 7. Typography, spacing and component styling

These are NUMPA recommendations; no reference font or measurements were verified.

- Use a readable sans-serif UI stack such as Inter with system sans-serif fallbacks. Use tabular numerals for counts, percentages and scores.
- Recommended type sizes: page title 28–32 px; section title 18–22 px; body 14–16 px; metadata 12–13 px. Keep dense table text at a readable 13–14 px.
- Use an 8 px spacing rhythm, with 4 px for compact inline alignment. Recommended page padding: 32 px desktop, 24 px tablet, 16 px mobile.
- Card radius: 12 px; inputs/buttons: 8 px; pill badges: fully rounded only when the badge is short. Use 1 px borders in dark mode; shadows should be subtle and reserved for overlays.
- Buttons: primary filled indigo with light text; secondary neutral outlined/raised; destructive action uses a clearly labeled confirmation and danger treatment, not color alone.
- Tables: sticky header where useful, subtle row dividers, aligned numeric columns, right-aligned numeric values and explicit units.
- Metric cards: label above value, value prominent, comparison/trend as secondary text with period and direction stated.
- Use consistent iconography with text labels for critical actions and statuses. Do not communicate issue type only with an icon.

## 8. NUMPA screen guidance

### Main dashboard

Purpose: resume work quickly and show the most relevant dataset state.

- Header: “Good morning/Welcome” optional; prioritize selected workspace and “Upload dataset” action.
- Main summary card: current dataset, version, last processed time and current workflow stage.
- Four compact metric cards: rows/columns, data-quality issues, missing cells, readiness status. Values come from the selected dataset; empty state prompts upload.
- Recent datasets and recent runs below the summary; status labels include completed, processing, needs review or failed.
- A focused “Recommended next step” panel links to the cleaning queue or readiness details, with the reason displayed.
- Avoid commerce-specific KPIs and avoid showing a readiness number as a performance prediction.

### Dataset upload and overview

- Upload: large, keyboard-operable drop area and browse button; list supported CSV/Excel formats and configured limits. Show where processing will happen and require explicit cloud consent before transfer. File validation errors explain the required correction.
- Workbook selection: list sheets and row/column estimates; expose warnings if structure is uncertain.
- Overview: dataset name, immutable version, source type, row/column count, parse status, and workflow progress. Show schema preview and detected issues with links to evidence.
- Preserve original source and clearly distinguish browser-local from cloud-saved datasets. Do not imply local data can be recovered after refresh unless persistence is implemented.

### ML readiness

- Display readiness status first: score available, pending/incomplete, or not applicable. Never render a final score while essential checks are pending.
- When available, use a large but not oversized score, explicit 0–100 label, task type, assessment profile/version and “not a model-performance guarantee” note.
- Below it show dimension rows/cards: completeness, validity, integrity, feature suitability, target/task suitability, data sufficiency and leakage/split checks as applicable.
- Each dimension shows state, score if computed, evidence, confidence/limitations and one practical improvement action.
- Use a segmented horizontal bar rather than a decorative gauge as the primary score; a radial gauge is optional only if its exact value and accessible text remain clear.
- Task-specific checks must change for classification, regression, forecasting and clustering. Not-applicable dimensions are labeled, never treated as zero.

### Data cleaning workspace

Use a two-area workspace: issue list/pipeline on the left or center, selected operation configuration and evidence on the right at desktop; stack these panels on mobile.

- Group findings by severity and field. Each issue row states what was detected, the measured count/rate, and a concise recommendation.
- Pipeline steps show order, enabled state, operation name and affected fields. Make dependencies/reordering rules visible.
- Editors are operation-specific: missing-value strategy, duplicate key/survivor rule, type locale/timezone, encoding/cardinality, scaling, outlier handling, feature/text options.
- Distinguish “Add to draft” from “Run preview” and “Apply changes.” Do not apply material changes directly from a recommendation card.
- Include a visible source version and preview freshness state.

### Cleaning preview and approval

- Show input dataset/version and pipeline configuration being previewed.
- Summary: affected rows/columns and expected output schema; show exact counts when known and disclose sampling/approximation otherwise.
- Use paired before/after views with the same scale and comparable population. Highlight changed cells/summary metrics without relying only on red/green.
- Show operation risks and reversibility/limitations before confirmation.
- Confirmation states that execution creates a new immutable version and preserves the source. If an operation is paid or cloud-based, show the authoritative quote/consent returned by the backend before confirmation.
- Any input/config change invalidates the preview and requires a new one.

### Before-and-after comparison

- Lock both sides to exact dataset versions and identify the selected operation/run.
- Compare quality counts (missing, duplicates, invalid values), shape, schema changes and relevant distributions. Keep denominators and cohort/filters consistent.
- Use paired metrics or small multiples with shared axis bounds. Label improvement, regression or unchanged; show counts and percentage-point changes with denominator.
- Separate data-quality changes from ML readiness changes. A readiness increase does not prove a better model.
- Add a “What changed” list with pipeline steps and “What remains” list with unresolved findings.

### Cleaning report and export

- Report sections: source/version, analyzed findings, approved operations, execution outcome, before/after evidence, readiness comparison, limitations and provenance.
- Preview report contents before download and identify whether data rows or only summaries are included.
- Export cleaned data as CSV or Excel only after successful execution. Offer safe CSV handling for formula-like values and explain any normalization.
- Downloads use authorized links for cloud artifacts or explicit local generation for browser-only datasets. Label format, version, generation time and expiration of a temporary link if applicable.
- Errors and partial outputs remain visible; never provide a misleading “success” export for a failed job.

## 9. NUMPA design tokens

All values below are proposed NUMPA tokens. The six source palette values are preserved above; added neutrals and sizing values are recommendations.

| Token | Recommended value | Semantic use |
|---|---|---|
| color.canvas | #09090B | App background |
| color.surface.1 | #101012 | Sidebar, card |
| color.surface.2 | #17171B | Raised card, input |
| color.surface.3 | #202025 | Hovered/selected neutral surface |
| color.border | #34343B | Dividers and outlines |
| color.text.primary | #F4F1F1 | Primary copy |
| color.text.secondary | #C2BEC2 | Secondary copy; recheck against each surface |
| color.text.reference | #D9D4D4 | Reference neutral text |
| color.text.muted.reference | #575359 | Decorative or on-light text only |
| color.accent.primary | #2F27F5 | Primary action/selection with light foreground |
| color.status.attention | #F92D03 | Attention marker, paired with text/icon |
| color.status.positive | #57B970 | Positive/completed marker, paired with text/icon |
| color.focus | #D9D4D4 | Visible focus outline on dark surface |
| radius.card | 12 px | Cards and panels |
| radius.control | 8 px | Buttons, inputs, menus |
| space.unit | 8 px | Base spacing rhythm |
| motion.standard | 150–200 ms | Optional state transition; respect reduced motion |

Color meaning is consistent across all pages: attention = requires review; positive = completed/healthy; indigo = selected/action; neutral = context. Do not use green to mean “ML-ready guarantee” or orange to automatically mean destructive. For destructive actions use explicit wording, confirmation and a distinct danger icon/label.

## 10. Data visualization rules

- Use chart titles that state the question or measure, not vague labels such as “Overview.”
- Show units, time/filter scope, dataset version, sample size and aggregation method where relevant.
- Keep axis ranges consistent for comparisons. If an axis is truncated, label it and explain why.
- Missingness: show count and percentage with denominator; a sorted horizontal bar chart is suitable for many columns, with a table alternative.
- Duplicates: separate exact duplicate rows from duplicate-key candidates; show group and row counts, not only a single score.
- Column profiling: table with type/confidence, null count/rate, cardinality, summary range and warning; detailed distribution opens on demand.
- Before/after: same scale/cohort, clearly marked versions and a concise delta summary.
- Readiness: dimension status and evidence with pending states. Do not draw missing evidence as zero.
- Avoid dual axes unless essential. Avoid 3D charts, decorative charts and color-only legends.
- Samples and approximations are visibly labeled. Chart selections are not causal evidence. A readiness score indicates observed suitability under a versioned assessment profile; it is not a model result or performance guarantee.
- Every chart provides accessible text/table data, keyboard-reachable controls and a non-color status indicator.

## 11. Interactions and interface states

| State | Treatment |
|---|---|
| Hover | Subtle surface/border shift; no meaning conveyed only by hover |
| Focus | High-contrast visible outline and logical keyboard order |
| Selected | Indigo accent plus text/icon/shape cue |
| Disabled | Reduced emphasis but readable; explain why unavailable when useful |
| Loading | Skeleton for known layout; indeterminate progress unless real percentage exists |
| Success | Green accent plus explicit status and next action |
| Warning/needs review | Orange accent plus reason and action |
| Error | Clear message, safe request/job reference and retry guidance |
| Empty | State what is missing and provide one obvious next step |
| Partial | Identify which checks/results did not complete |

Use progressive disclosure: concise summary first, details/evidence on expansion. Confirm destructive, paid, cloud-transfer and material transformation actions. Preserve user draft configuration when navigating where technically supported; clearly label unsaved work. Tooltips supplement labels, never replace them. Toasts confirm transient events; durable job state remains on the page.

## 12. Responsive and accessibility requirements

Recommended layout breakpoints: compact/mobile below 640 px; tablet 640–1023 px; desktop 1024 px and wider. These are NUMPA implementation suggestions, not reference measurements.

- Desktop: persistent sidebar and multi-column evidence cards; preserve one clear primary column.
- Tablet: collapsible sidebar and two-column cards where content remains readable.
- Mobile: drawer navigation, one-column cards, stacked workflow, full-width primary actions, and horizontally scrollable or row-detail tables. Keep dataset/version and current action visible.
- Support keyboard-only operation, semantic landmarks/headings, visible focus, labels and linked errors, focus-managed dialogs, Escape behavior and focus restoration.
- Meet WCAG 2.2 AA contrast targets. Never encode status solely by color; combine color with text, icon, pattern or position.
- Support 200% zoom without losing core content/actions, reduced-motion preferences, touch targets around 44 CSS px, and screen-reader announcements for meaningful progress changes.
- Charts provide accessible summaries and tabular data. Data tables have captions, scoped headers and keyboard navigation.
- Verify actual token pairs and interactive states in implementation; contrast calculations above are starting guidance, not a conformance claim.

## 13. Implementation guidance and consistency

- Implement semantic tokens first, then shared primitives and the application shell, then dataset workflow screens. Keep page-level layout and reusable UI separate from feature behavior.
- Use the Plan 5 routes and component boundaries. Use Plan 4 evidence/chart/result contracts; the UI renders them rather than recalculating scores, counts or metrics.
- Use Plan 2 dataset-version and artifact provenance; every result/visualization names its source version.
- Use Plan 3 job status, safe errors, quote and download-link APIs. Never fabricate progress, payment, results or ownership.
- Centralize color, type, spacing, radii and state semantics. Do not create per-screen color meanings.
- Validate desktop/tablet/mobile, loading/empty/partial/error/success states, keyboard navigation, chart alternatives and contrast in component review.
- This document is a design direction, not evidence that the interface has been implemented or tested.

## 14. Reference limitations and open questions

The screenshot itself was unavailable for inspection, so exact geometry, typography, component treatment, chart forms, navigation, spacing and interaction patterns remain unknown. The page description and palette are verified; NUMPA-specific implementation recommendations are explicitly proposed.

Open design decisions for a later prototype review: light-theme alternative and user preference; final font asset/license; exact logo/brand mark; whether dashboard supports multiple workspaces; charting library implementation; data table behavior for very wide datasets; and final numeric token values after contrast testing.

## 15. UI design review checklist

- [ ] Dataset and immutable version are visible on analysis, cleaning, readiness, comparison and report views.
- [ ] Main dashboard prioritizes upload/resume, dataset state and useful data-quality metrics.
- [ ] Recommendations are understandable and linked to evidence.
- [ ] No readiness score appears final while required checks are pending; score is not framed as performance guarantee.
- [ ] Cleaning operations are reviewed, previewed and explicitly confirmed before execution.
- [ ] Preview binds to exact input version/config; stale preview is clearly invalidated.
- [ ] Before/after uses comparable versions, scales, filters and denominators.
- [ ] Sampled/approximate charts disclose method and scope.
- [ ] CSV/Excel/report exports identify version and preserve safe handling.
- [ ] Colors keep the published hex values; proposed roles are treated as NUMPA choices.
- [ ] Contrast, keyboard focus, screen-reader labels and color-independent status are reviewed.
- [ ] Responsive layouts remain usable on desktop, tablet and mobile.
- [ ] Loading, empty, partial, failed, disabled and completed states have clear next actions.
- [ ] UI facts match backend evidence and no business score/charge is computed in presentation code.
