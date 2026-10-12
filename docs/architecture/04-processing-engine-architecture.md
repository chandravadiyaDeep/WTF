# NUMPA v2 — Plan 4: Processing Engine Architecture

## 1. Purpose and status

**Status:** Draft for review. This is a processing design, not engine code or a package selection. It uses Plans 1–3 as constraints: workspace-scoped provenance, private cloud objects, browser-local processing without hidden upload, FastAPI control plane, durable jobs, versioned results, user-confirmed material changes, and token authorization.

**Recommendation:** use one versioned operation contract across browser and cloud adapters. Keep the API as control plane; processing engines are libraries/adapters invoked by a router or worker, not separate microservices. Persist canonical schema and provenance separately from raw files. Keep output immutable and every automated decision tied to evidence/config version. Start with bounded in-memory/browser and single-worker cloud paths; add chunked/out-of-core engines when measured workloads justify them.

## 2. Components and ownership

| Component | Owns | Inputs → outputs | Calls |
|---|---|---|---|
| File Ingestion Engine | Source registration, upload intent completion, parser dispatch, safe staging | User file/object or browser manifest → source asset and ingestion outcome | Format detection, validator, storage, job service |
| Format Detection and Validation | Evidence-based format/media detection, structural checks, safe decode | Bytes/header/extension hints → detected format, validation findings, parse plan or failure | Format adapters; never trusts extension alone |
| Canonical Dataset Representation | Typed schema, field IDs, row/column batches and provenance contract | Parsed records plus schema decisions → canonical version or local session representation | Parser adapters, dataset/version persistence |
| Processing Router | Choose browser/local vs cloud, sync vs job, resource/cost estimate | Dataset/operation/capabilities/consent → route decision and reasons | Policy/config, capability probes, billing quote, job service |
| Browser Engine | Supported local operations without raw upload | Local canonical data + operation contract → result/evidence/local output | Shared operation registry; returns client provenance |
| Cloud Engine | Authorized persisted or compute-heavy operations | Private object/version + operation contract → private outputs/run result | Worker, storage, shared operation registry |
| Analysis/Profiling | Data-aware statistics and findings | Canonical dataset sample/stream → schema/profile/findings | Type-aware aggregators, explanation/evidence |
| Cleaning/Preprocessing | Recommendations, preview, deterministic execution | Dataset version + pipeline version + task context → preview/operation results/new version | Operation catalogue, router, lineage store |
| Visualization | Choose/render charts from findings/profile/results | Typed chart intent + source/version → chart spec and optional artifact | Aggregation/sampling, explanation engine |
| ML Readiness | Deterministic task-specific assessment | Dataset profile/evidence + readiness profile version → dimensions/score/state | Checks registry, profile repository |
| Recommendations | Suitable candidate selection, not performance prediction | Task, schema/profile/readiness and constraints → ranked candidates/rationale | Algorithm registry, preprocessing compatibility |
| Training | Fit bounded experiments and persist fitted transforms/model refs | Dataset version + frozen experiment/split/config → job, fitted pipeline/model artifact | Worker, algorithm adapters, private storage |
| Evaluation/Comparison | Metric calculation, valid split comparison, ranking | Predictions produced by runs + protocol → metrics and comparison snapshot | Metric registry; receives no training access to held-out test set |
| Explanation/Evidence | Deterministic structured rationale and evidence references | Finding/decision/measurement → shared explanation contract | All engines; optional language rendering consumes facts only |
| Report Generation | Render report from authorized persisted results | Report source refs + template version → private report artifact | Job service, visualization/results, storage |
| Resource/Cost/Job Management | Limits, estimates, reservations, durable state, cleanup | Operation estimate/request → authorized execution and settlement | Plan 3 billing/job services; never engine-selected price |

Business decisions are owned by the relevant service/engine; API handlers validate and delegate. The router may reject or defer a request but does not change user data. A transformation is applied only by the cleaning executor after preview and required user confirmation.

## 3. Shared contracts

### Operation envelope

Every operation request uses a versioned, engine-neutral envelope:

- operation_code and operation_version;
- input descriptor: dataset/version ID for cloud, local session handle for browser, schema fingerprint, row/column estimates and content fingerprint when available;
- task context: task family, target/feature selection, privacy and consent state;
- parameters and parameter-schema version;
- requested outputs (summary, findings, chart specs, transformed version, metrics);
- resource policy (timeout, memory/row/column limits) and idempotency/correlation IDs.

A result returns operation/version, status (completed/partial/needs_input/unsupported/failed), validated output descriptors, warnings, measurements, structured findings/evidence, provenance, resource usage and engine identity/version. Never return a raw dataframe as an API response. Unknown versions and parameters fail explicitly.

### Canonical dataset

A canonical dataset is a logical typed table, not necessarily a single in-memory object or cloud copy. Its descriptor contains:

- dataset_id and immutable dataset_version_id when persisted; local-session ID when not;
- ordered fields: stable internal field_id, original/display name, safe unique display key, logical/physical type, nullable, parse confidence, source locator and semantic role if known;
- row/column counts or estimates, accepted/rejected counts, schema fingerprint, source format/parser version;
- lineage: source asset or document, sheet/table/JSON path, parent version, transformation run and config hash;
- validation warnings/findings and completeness/partial status.

Raw file bytes remain separate. Internal IDs survive renames and can be linked across versions; new/unmatched fields get new IDs. Duplicate header labels are preserved as original labels and assigned deterministic disambiguated display keys; never silently overwrite a column. Mixed types use a conservative common representation or preserve as text with per-value parse findings; the user can choose a coercion. Nullability is inferred from observations, not assumed schema truth. Rows include source position/locator for evidence when available, not exposed raw excerpts by default.

Lossless guarantee applies to the retained original file, not every normalized view. Parsing cannot silently discard records: report counts and retain rejected records/locations in a protected sidecar or allow the user to download them. If policy cannot retain rejected values, preserve the source file and state exactly what was excluded. Deterministic normalized output records parser/config/version and checksum.

## 4. File ingestion by format

| Format | Detect and validate | Parse/canonicalize | Errors and user choice |
|---|---|---|---|
| CSV | Inspect signature/BOM, extension as hint, delimiters/quotes/header consistency, encoding, row-width drift and size/row limits. Try a bounded set of safe encodings/delimiters; do not silently guess when ambiguous. | Stream/chunk records where supported. Preserve source header labels and source row numbers. Infer types with confidence/sample then validate full input. | Ambiguous encoding/delimiter/header prompts user or preserves text. Malformed rows become findings/rejected-record references; report accepted/rejected counts. Reject corrupt/truncated input without replacing source. |
| Excel | Inspect actual container/signature and workbook validity; enumerate sheets, hidden state, dimensions, formula/cached-value presence and merged-cell warnings. Reject unsupported encrypted/corrupt workbooks. | Each selected sheet is a table candidate. Preserve sheet name/cell range, formulas vs cached value policy, merged cells and header-row choice. Multiple sheets create distinct candidates/structured datasets. | Ask user to choose relevant sheets/header rows when uncertain. State that formulas are not executed by NUMPA. Unsupported workbook features produce explicit warnings/errors. |
| JSON | Detect JSON vs JSON Lines/NDJSON from valid structure; validate top-level shape and bounded nesting/size. | Arrays of objects map to records; object-wrapped arrays require path selection. Nested objects may flatten using reversible escaped paths; arrays remain structured unless user selects an expansion rule. Preserve source path and null/missing distinction where supported. | Irregular records create path/type findings; malformed lines can be rejected individually with counts. Do not silently explode arrays, drop keys or truncate nesting. |
| PDF | Detect PDF signature, parseability, page count and text/image characteristics. PDF is a document, not a table. | Extract text/table candidates by page/locator. Scanned/image pages require OCR capability (later adapter) and lower confidence. Each table candidate has page/range, extraction method/version, confidence and validation findings; accepted candidate becomes child structured dataset/version. | Multiple/ambiguous tables require user selection; no candidate or failed extraction remains a document with failed/partial status and findings, never a fabricated empty table. Preserve source. |
| Future formats | Adapter declares MIME/signature tests, limits, parser version, output schema and loss/warning behavior | Convert to canonical contract without format-specific assumptions in downstream engines | Unsupported features remain explicit; adapter conformance tests required before enabling |

Encrypted files, macros/active content, decompression bombs, extreme nesting, binary/unsupported structures, and parsers that exceed resource/time limits are rejected or quarantined safely. File extension alone never establishes type. Never log raw rows or filenames unnecessarily.

## 5. Browser/cloud router

### Decision model

The router returns one of: browser, cloud, user_choice_required, unsupported, or resource_blocked. It evaluates a policy/configurable estimate rather than a fixed file-size threshold:

- format adapter support and parse complexity;
- row/column counts and estimated resident memory (parsed values, intermediate copies, model matrices);
- operation complexity and expected time;
- candidate algorithms, model count and training requirements;
- browser memory/device capabilities and current tab budget when available;
- cloud storage persistence/recovery need and whether a private cloud version exists;
- user privacy preference, per-operation consent and whether raw data would leave device;
- quote/available token authorization for billable cloud work;
- operation's browser/cloud capability and resource ceilings.

Estimates carry confidence and reason codes. Unknown estimates bias toward a preview/choice or safe rejection, not an unannounced upload. Thresholds and resource budgets are deployment configuration calibrated from telemetry; no numerical limit is approved here.

### Routing rules

1. Browser-only stays local if operation is supported and user/device budget permits. API may supply versioned logic/config but receives no raw rows.
2. Cloud-required operation requires explicit cloud consent, an authorized cloud dataset/object, workspace access and (if paid) confirmed reservation before enqueueing.
3. If browser budget is exceeded, return needs_cloud_choice with reasons and an estimated cost. Cloud retry is a new explicit action; do not auto-upload or auto-charge.
4. If cloud fails, record failure and offer retry or local path only if the same operation can run safely there. Reuse idempotency/reservation policy; do not duplicate charge/output.
5. If persistence/recovery is required, explain that local-only mode cannot provide it; request opt-in before saving raw or result data.
6. User preference cannot override hard security, unsupported format or resource limits. A user can choose stricter privacy than router defaults.

### Initial and scaling path

Start with client capability self-report plus conservative configured row/column/memory estimates for a small supported format/operation set; label estimates and allow preview. Browser adapter runs bounded operations. Cloud path uses direct private upload and one worker process as Plan 3 describes. Record only coarse routing reasons/resource telemetry without file contents.

Scale in stages: improve measured memory/time estimates; add resumable/chunked ingestion and object streaming; add worker concurrency and queue backpressure; then introduce out-of-core algorithms or a separate queue/compute system only when observed workload requires it. Plan 6 sets abuse/quotas; Plan 7 chooses production limits and monitoring.

## 6. Analysis and profiling logic

### Default profile

Run bounded checks by default on a validated canonical dataset:

- dimensions, schema, inferred types/confidence and parse errors;
- null/missing counts and ratios by field and overall;
- exact duplicate rows and candidate duplicate keys reported separately;
- unique counts/cardinality and constant/near-constant fields;
- type-appropriate numeric summaries (count, mean/median, spread, quantiles, skew where meaningful), categorical top values/frequencies, boolean counts;
- date/time parse rate, range, gaps, timezone ambiguity and regularity where applicable;
- invalid/inconsistent values against declared or inferable rules;
- identifier/PII-like and potential target signals as hypotheses, not assertions;
- bounded pairwise relationships/correlations for compatible numeric fields and a sample/cap policy;
- potential unusual values using robust quantile/IQR or task-appropriate checks, labeled as review candidates rather than errors.

Conditional checks include text length/language/empty string profile; categorical cross-tabs; class balance and rare labels after target selection; multicollinearity signals; time-series seasonality/gaps after a time/target selection; and expensive pairwise association tests. Do not run all O(columns²) associations on wide tables. Use deterministic sample or top-k candidates and state sampling method/size.

Use streaming/mergeable aggregators for counts, nulls, duplicates where supported, quantiles/skew approximation and cardinality; exact checks may require external sort/hash and resource budget. Estimate memory before materialization. Treat high-cardinality categories with bounded top-k and cardinality estimates; avoid materializing every distinct value. Missing/type statistics are type-aware; do not compute numeric skew for identifiers/text or correlation for incompatible fields.

Each result includes exact dataset version/fingerprint or local session, parser/profile version, sample/approximation metadata, field references, measured value/unit, severity/rule, confidence/limitations and evidence link. Identify target candidates only after user task/target input; don't infer a definitive target based on column name alone.

## 7. Smart cleaning and preprocessing

### Operation lifecycle and pipeline rules

Detect → explain → recommend → preview → confirm material changes → execute → validate → persist new immutable version when requested → report before/after and lineage. Preview can use a bounded sample but must say whether it is sampled and include exact counts when known. A preview is tied to input version/fingerprint and pipeline config hash; stale input or changed parameters invalidates confirmation. Execution writes a new version; source remains intact.

Each step has operation code/version, typed parameters, input/output schema, deterministic flag, random seed if applicable, fitted-state artifact reference when needed, and before/after evidence. Steps form a validated DAG or an explicitly ordered sequence; MVP uses a sequential order to keep behavior understandable. Dependencies are resolved before run: parse/correct type → missing/invalid handling → duplicate policy → feature transform/encoding/scaling → feature selection. A pipeline cannot fit on test data. Fitted preprocessing state is trained only on training partition and reused at validation/test/prediction. If cleaning a dataset outside an ML experiment, fitting scope is the whole chosen dataset and results are not represented as held-out ML evaluation.

For failure, stop dependent steps, preserve source and prior committed version, mark partial execution, clean incomplete objects, and expose step errors. Determinism requires fixed operation versions, parameters, input fingerprint and seed; nondeterministic/external operations state limitations.

### Operation catalogue

| Family | Preconditions and configurable strategies/default selection | Skip/unsafe conditions | Preview, evidence, validation and risks |
|---|---|---|---|
| Missing values | Select columns; preserve missing indicator optionally. Numeric: median robust default for skew/outliers, mean only when distribution/goal justifies; categorical: explicit “Unknown” or most-frequent only when meaning appropriate; time series: forward/backfill/interpolation only with ordered time and bounded gaps. | Skip if no missing, identifier/target semantics unclear, or method leaks across split. Do not impute target labels by default. | Show affected rows/fields and before-after distribution; validate no unexpected nulls and type preserved. Risks: synthetic values, bias, loss of missingness signal. |
| Duplicates | Distinguish exact full-row duplicate from duplicate on user-selected key columns; default detect/report only. Remove exact duplicates only after confirmation; key duplicates require conflict resolution. | Skip deletion if key semantics/conflict policy unknown or all duplicate rows differ materially. | Count groups/rows, examples via privacy-safe locator, selected survivor rule. Validate counts/key uniqueness. Risks: legitimate repeat events or repeated measurements removed. |
| Type correction | Propose parse to numeric/date/category/boolean with confidence and invalid-value counts; user chooses locale/timezone/format if ambiguous. | Do not coerce mixed or locale-ambiguous values silently; keep source and rejected-value refs. | Preview parse success/failure and range; validate reversible source, null/invalid counts, type schema. Risks: precision loss, timezone shift, leading-zero IDs. |
| Categorical encoding | One-hot for low-cardinality nominal; ordinal only with explicit ordering; frequency/hash only where justified and documented; unknown-category policy explicit. | Skip ID-like/high-cardinality text, target/identifier columns, and ambiguous ordinal semantics. Target encoding is excluded from simple cleaning; if later added, it must be fold-fitted. | Show output feature count and mapping/unknown handling; validate no row/target leakage. Risks: dimensional growth, false ordering, privacy exposure from rare levels. |
| Scaling/standardization | Standard scaling for algorithms sensitive to scale; robust scaling when outliers distort; min-max only when bounded range is useful. Tree models usually skip. | Skip for tree families or when units/range must remain interpretable; fitted only inside training split for model evaluation. | Before/after ranges/summary; validate finite values and pipeline fit scope. Risks: loses original units, leakage if fit globally. |
| Outlier detection/treatment | Detect using robust quantiles/IQR or domain bounds; treatment options: keep/flag, cap, transform, remove only after explicit rule. Default is flag/review, not remove. | Skip if small sample, skew/distribution makes rule unreliable, or values may be valid rare events. | Plot/rows affected, thresholds and reason; validate counts and target relationship. Risks: removing real signal or inequity in tail cases. |
| Feature selection/transformation | User-approved domain transforms; low-variance/redundancy screens; supervised selectors only within training folds. | Skip if target/feature roles unresolved, sample too small, leakage risk or transformation not reversible/understood. | Show features added/removed and evidence; enforce split-bound fitting. Risks: information loss, instability, leakage. |
| Text cleaning | Configurable Unicode normalization, whitespace, case, tokenization, stopword/regex rules, language-specific steps; retain raw source feature. | Skip language-ambiguous or semantic text unless user selects method; never remove words by default solely from generic stop list. | Show reversible examples/counts without exposing sensitive text; validate empty rate and deterministic tokenizer/version. Risks: meaning/sentiment negation loss. |

Unsafe or ambiguous cases return needs_user_input with candidate strategies and evidence, not guessed transformations. A default is a recommendation, not application consent.

## 8. Visualization engine

Chart selection is rule-driven from findings, data types, task and user goal. A chart spec includes spec_version, chart_type, source dataset/run/version, field IDs, aggregation, filters, sampling method/seed, axis/units, title, accessible description, linked finding/evidence, explanation, uncertainty and warnings.

- Quality: missingness bars/heatmap (bounded fields), duplicate counts, parse failures.
- Numeric/categorical: histogram/quantile view, frequency/top-k with “other” count, box/violin where sample supports.
- Relationships: scatter/hexbin or sampled points; correlation heatmap only for bounded numeric field set.
- Time: ordered series with gaps/aggregation and explicit timezone/frequency note.
- ML: class distribution, target/feature relation, readiness dimension chart, metric comparison with metric direction/uncertainty.
- Cleaning: paired before/after summaries using same scale and cohort; mark changed rows/fields and sampled display.

For large data, aggregate in engine and return bins/counts rather than raw rows. Use deterministic stratified/reservoir sample only when a point chart requires points; include sample count/fraction and seed. Avoid visualizing sensitive raw categories unnecessarily. Chart is evidence/communication, not causal proof.

## 9. Shared explanation and evidence contract

All engines emit structured facts; UI renders them, it does not invent rationale. Contract fields: finding_code/version, technical_term, user_label, plain_description, condition, severity, measured evidence (field IDs, numerator/denominator, unit, exact/approximate/sample), recommended_action and reason, action status, before/after impact, linked chart spec, confidence/limitations, source dataset/run/config version.

Deterministic rule/calculation produces code, numbers, severity and recommendation. Optional language generation may paraphrase only those fields, cannot create measurements, change severity/score, or select transformations. If generation is unavailable, deterministic template remains. Keep sensitive examples out of output/logs; exact raw values require a justified user-facing need and safe access.

## 10. ML readiness

Use versioned profiles with dimension definitions, task-specific applicability, weights, thresholds, and scorer version. Dimensions: completeness; validity/consistency; record integrity; feature suitability; target suitability (adapted for target-free clustering); data sufficiency; leakage/validation checks.

Input evidence includes parse/type validity, missingness, duplicate/key integrity, usable feature count/types/cardinality, target completeness/class balance/variance when supervised, sample and temporal coverage, feature leakage warnings, split feasibility, and task-specific constraints. Each dimension returns score/status, evidence refs, confidence and applicable/not-applicable state.

Overall score is a configured weighted aggregation only when required dimensions are computed and validation/leakage checks are resolved. Otherwise return pending/incomplete with reasons, no final overall score. Clustering target suitability is not a missing target penalty; use feature distance/sparsity/clusterability evidence. Forecasting checks timestamp parse, order, duplicates/gaps, horizon vs history, enough temporal folds and leakage-prone future features. Classification checks label count/rare classes and split feasibility; regression checks target parse/variance and sample validity.

Normalize applicable dimension scores to a documented 0–100 scale and require the published profile's applicable weights to be nonnegative and sum to 1. Overall = sum(weight × dimension_score) over applicable, completed dimensions, divided by the sum of their weights; show the included dimensions and weights. This weighted score is withheld if a required dimension is pending, unresolved leakage/validation exists, or evidence coverage is below the profile's reviewed completeness rule. Profiles may mark a dimension not applicable for a task (for example supervised target suitability for clustering); excluded weight is renormalized and disclosed, never silently treated as zero.

Scores are deterministic for fixed input/profile/scorer versions. Save exact dataset version/fingerprint, profile version, evidence and score explanation. Thresholds/weights remain configurable and require approved product calibration; no universal row-count guarantee.

## 11. Recommendations, training, evaluation

### Candidate selection

Recommendation returns up to four candidates after capability filters, not a predicted performance winner. Apply task support, feature type/cardinality, sample/memory budget, missing-value/pipeline compatibility, target properties, validation method and latency/cost constraints. Record rejected candidates with reason when useful.

Initial candidate pools (specific versions/package roster is Plan 7/implementation decision):

| Task | Initial candidate families | Selection notes |
|---|---|---|
| Classification | Regularized logistic/linear classifier; random forest/extra trees; histogram gradient boosting; linear margin classifier | Favor interpretable/linear baseline and nonlinear tree candidate; check class count/imbalance, probability support and high-cardinality behavior. |
| Regression | Ridge/elastic-net linear; random forest/extra trees; histogram gradient boosting; robust/linear margin regression where budget supports | Include simple baseline; consider target skew, outliers, feature cardinality, scale and training budget. |
| Forecasting | Seasonal/naive baseline; autoregression/linear lag model; tree boosting on lag/calendar features; optional trend/seasonal statistical family after feasibility | Requires ordered timestamp, horizon and baseline. Do not use random split. Candidate pool shrinks if history/frequency/irregularity is insufficient. |
| Clustering | K-means; mini-batch K-means; agglomerative for bounded data; density-based clustering for suitable geometry | No target; scaling/distance choice matters. Density methods may produce noise; agglomerative is limited by memory. Return fewer if geometry/cardinality/resources make a family unsuitable. |

Recommendation rationale covers fit, assumptions, preprocessing, resource estimate and limitations. An algorithm is only suitable to try, not guaranteed best. Actual ranking comes after valid evaluation.

### Training and leakage control

Freeze task config, dataset version, feature/target roles, validation protocol, algorithm/config versions and seed before execution. Split first. Fit imputation, encoding, scaling, feature selection and any learned transforms on training data only; apply fitted state to validation/test. For cross-validation, fit each pipeline inside each fold. Keep validation for selection and evaluate once on held-out test; if data is too small for defensible test split, mark limitation and use suitable resampling without claiming independent final test evidence.

Forecasting uses chronological expanding/rolling origins; a gap/embargo may be configured where features/labels overlap. Every fold's training timestamps precede its validation timestamps; preserve horizon and aggregation assumptions. Standard random K-fold can leak future structure and is not default. See official [scikit-learn leakage guidance](https://scikit-learn.org/stable/common_pitfalls.html) and [time-series split guidance](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html).

### Metrics and comparisons

Primary metric and direction are selected/configured before training; show companion metrics and plain meaning. Compare only runs with compatible dataset version, target, split protocol and metric definition, or label differences and avoid direct ranking.

- Classification: accuracy plus precision/recall/F1 with averaging rule; class distribution and confusion summary. ROC-AUC only when score/probability output and class structure support it; undefined single-class folds are reported as unavailable, not coerced to zero.
- Regression: MAE and RMSE/MSE, R² when sample/target makes it meaningful. State units and whether lower/higher is better; report undefined/constant-target cases.
- Forecasting: MAE/RMSE; percentage metric only if denominator is safe and nonzero; document zero/near-zero behavior and scale dependence. Aggregate across chronological folds with spread.
- Clustering: silhouette, Davies–Bouldin, Calinski–Harabasz only where their assumptions/cluster count/distance support them. Include noise/degenerate-cluster handling and limitations; internal scores do not establish real-world usefulness.

Use a baseline and bounded candidate count/training budget. Comparison table labels metric direction, split, sample count and uncertainty/spread. No metric is emitted as completed unless calculated from actual predictions. Undefined metrics use status/reason. Metric choices and limitations align with [official scikit-learn evaluation guidance](https://scikit-learn.org/stable/modules/model_evaluation.html).

## 12. Large data, failure, cost, and recovery

Initial approach: stream file validation where supported; avoid duplicate whole-file copies; use chunked counting/aggregation and bounded samples; persist intermediate output only as private temporary artifacts with job IDs; cap concurrency and operation-specific memory/time. Algorithms that require full materialization are routed only if estimate fits policy. If no safe path exists, return resource_blocked with explanation. Do not claim distributed processing.

Every job has operation/config/input fingerprints, progress stages, heartbeat, resource estimate/actual summary, attempts and output refs. Cancellation is checked between chunks/steps/folds; cleanup partial objects idempotently. A retry uses same logical idempotency key only when operation/config are identical. Changed config or route creates a new job after fresh consent/quote. Input source/version remains untouched. Cloud retry from a browser failure requires explicit cloud choice and upload consent.

Router emits estimated cost inputs; trusted billing service applies price, reserves tokens, authorizes execution and settles actual authorized use. Engines report measured usage (bytes/rows/columns, runtime, memory class, model count) but never choose prices. Failure releases reservation unless approved policy bills completed partial work; retries cannot duplicate capture.

Error categories: unsupported_format/feature, invalid_data, ambiguous_input, needs_user_input, resource_blocked, consent_required, storage_failure, operation_failure, cancelled, timeout, internal. Each has retryable flag, safe user message, stage and correlation/job ID. Raw cell data and secrets are excluded.

## 13. Implementation priorities and dependencies

1. Agree canonical descriptor, operation envelope, result/finding/chart contracts and supported first formats.
2. Implement CSV/Excel/JSON validation/parser adapters, canonical schema/provenance, duplicate/mixed-type/rejected-row findings, and local/cloud contract conformance.
3. Implement basic profile aggregators and structured evidence; no ML scoring before inputs are validated.
4. Implement cleaning catalog preview and deterministic operations, confirmation binding, pipeline ordering, validation and new-version lineage.
5. Implement router with consent/capability/resource policy and cloud worker path; add usage estimates and safe cleanup.
6. Add chart specs/aggregations, versioned readiness dimensions and task-aware recommendation rules.
7. Add leakage-safe training pipelines, task-specific splitters/metrics, resource limits and comparison.
8. Add PDF table-candidate adapter after extraction confidence/user-selection UX is specified; OCR as a later capability.
9. Add reports and scale-out/out-of-core options after usage evidence.

**Plan 2 dependencies:** canonical schema/version IDs, private object lifecycle, workspace RLS, processing jobs, immutable results, artifact refs, billing reservation/ledger. Existing Plan 2 draft is adequate input; exact schema adjustments from operation contracts are recorded for later migration planning.

**Plan 3 dependencies:** operation/job APIs, worker leases/retries/cancellation, auth/workspace authorization, upload/signed URLs, billing quote/reservation/settlement, errors/telemetry. Plan 3's modular service boundaries host these engines.

**Later scale path:** out-of-core processing/columnar formats, distributed execution, GPU, parallel model search, OCR at scale, richer algorithm registry, external queue/compute. These are not MVP requirements and need workload evidence.

## 14. Open decisions

No blocker to this architecture draft. Before implementation, choose initial formats and parser capabilities, maximum rows/columns/file bytes and worker memory/time budgets, browser persistence/capability UX, PDF extraction confidence and OCR phase, readiness scoring weights/thresholds, supported algorithm/version roster, primary metrics by task, and token cost estimation policy. Do not invent the numeric thresholds or prices here.

### Technical references

- [scikit-learn common pitfalls and leakage prevention](https://scikit-learn.org/stable/common_pitfalls.html)
- [scikit-learn time-series cross-validation](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html)
- [scikit-learn metrics and evaluation](https://scikit-learn.org/stable/modules/model_evaluation.html)
