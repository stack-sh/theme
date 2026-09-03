# Stack Theme Catalog Contract

## Status

This document defines the draft `1.0` catalog document shape. Catalog and package version `0.2.0` remain pre-1.0 and may change incompatibly before a stable release. Registry publication is outside this repository change.

The JSON Schema at [`schemas/catalog.schema.json`](./schemas/catalog.schema.json) is the machine-readable source of truth. [`catalog/catalog.json`](./catalog/catalog.json) is the only source catalog. Generated Cargo and npm copies must not be edited directly. The schema is copied into both packages; `$schema` is an editor-facing canonical repository URL and runtime consumers do not fetch it.

## Catalog identity

Every catalog has these required top-level fields:

| Field | Meaning |
| --- | --- |
| `$schema` | Schema location for editors and validators |
| `schemaVersion` | Catalog document shape; currently `1.0` |
| `catalogVersion` | Semantic version shared by the source catalog, Cargo crate, and npm package |
| `reservedThemeIds` | Previously registered theme identifiers that cannot be reused |
| `fallbacks` | Core theme and logical icon identifiers used after missing-resource diagnostics |
| `fontMetrics` | Deterministic font measurement records |
| `themes` | Themes in canonical catalog order |

Theme identifiers use the Stack language identifier form. Active identifiers are unique and cannot also be reserved. When a registered theme is removed, its identifier moves to `reservedThemeIds`; it is never reassigned.

`fallbacks.missingThemeId` must identify an active core theme. `fallbacks.missingIconId` must identify an icon present in every active theme with one stable subject. A renderer emits the applicable missing-resource diagnostic before selecting these records; fallback data does not hide the missing request.

`catalogRevision` is generated metadata rather than a source field. It is a `sha256:` digest over the normalized source catalog followed by every unique referenced SVG path and byte sequence in path order. The revision therefore changes when semantic catalog data, provenance, or icon bytes change, without requiring a Git commit to contain its own commit identifier.

## Theme records

A theme requires `id`, `name`, `palette`, `typography`, `nodeKindFallbacks`, `connector`, and `icons`. `description` is optional.

`palette` requires `canvas`, `surface`, `surfaceMuted`, `text`, `textMuted`, `border`, `accent`, `danger`, and `connector` colors. Colors are six- or eight-digit hexadecimal sRGB values. Other records refer to these semantic slots instead of duplicating colors.

`typography` requires:

- `fontMetricsId`, which must resolve to one catalog font metric record;
- node label, node detail, group label, and edge label sizes in integer thousandths of a CSS pixel;
- line height in integer thousandths of the selected font size;
- label and detail weights from 100 through 900.

Integer units keep Rust and JavaScript consumers from introducing representation-dependent rounding before layout begins.

`nodeKindFallbacks` requires one visual for every Stack 1.0 node kind: `actor`, `client`, `service`, `function`, `worker`, `database`, `cache`, `queue`, `storage`, and `external`. Each visual requires a renderer-supported shape, palette references, corner radius, and a theme-local `fallbackIconId`. Every fallback icon must exist in that theme.

`connector` requires line, text, and label-background palette references plus integer line width and arrow size. `dashMilliPx` is the only optional connector field; absence means a solid line.

## Font metrics

A font metric record requires `id`, `family`, `version`, `unitsPerEm`, `ascent`, `descent`, `lineGap`, `defaultAdvance`, `wideAdvance`, ordered non-overlapping `wideRanges`, `glyphAdvances`, and the same source, license, and distribution `provenance` required for icon assets.

Advances use integer font design units. `glyphAdvances` keys are uppercase Unicode scalar labels such as `U+0041`. A consumer first uses an explicit glyph advance, then `wideAdvance` for a scalar in an inclusive `wideRanges` entry, and finally `defaultAdvance`. This makes Latin and wide-script measurement deterministic without a host Unicode-width or font API. The metrics version, catalog version, and revision identify the exact table and ranges used by a render.

## Icon metadata and provenance

Icon identifiers are unique within one theme. Each icon requires `id`, a stable logical `subject`, and `asset`; `description` is optional. When the same icon identifier appears in multiple themes, its `subject` must be identical so theme switching cannot change its meaning. Themes may reference one shared asset path only when the logical icon identifier and complete asset metadata are identical; reusing a path for different or conflicting metadata is rejected.

An icon asset requires a repository-relative SVG `path`, four-integer `viewBox`, and `provenance`. Provenance requires:

- HTTPS source URL and pinned source revision;
- copyright statement;
- SPDX license expression and either the root `LICENSE` or a file under `licenses/`;
- modification status;
- explicit permission for Cargo, npm, WASM, and commercial-application redistribution.

The catalog rejects assets that are not permitted in every supported distribution channel. `THIRD_PARTY_LICENSES.md` must also record third-party assets before they are committed.

SVG validation uses an element and attribute allowlist. It rejects scripts, event handlers, nested SVG documents, CDATA, processing instructions, doctypes, entities, style attributes, `href`, `url(...)`, executable schemes, data URLs, network URLs, arbitrary namespaces, and any element or attribute outside the allowlist. The root `viewBox` must exactly match catalog metadata. Renderers may inline only validated, catalog-owned SVG bytes and must never resolve a source identifier as a path or URL.

## Cargo and npm boundary

Cargo `stack-theme` exposes typed Rust records, `catalog()`, `catalog_json()`, `catalog_schema_json()`, `icon_svg()`, `CATALOG_VERSION`, and `CATALOG_REVISION`. npm `@stack-sh/theme` exposes the equivalent frozen `catalog`, `iconAssets`, `iconSvg()`, `catalogVersion`, and `catalogRevision`, plus TypeScript declarations and catalog, metadata, and schema JSON subpath exports. Referenced SVG and license files are copied into both package roots; SVG bytes are also embedded behind the Rust and JavaScript accessors so runtime consumers never resolve catalog paths through the host.

`npm run generate` validates the source catalog, checks package version equality, computes one revision, and updates both package artifacts. `npm run generate:check` fails when a generated artifact is missing or stale. Generated package data is checked into Git so Cargo and npm builds do not need network, filesystem discovery, Git, a clock, locale, or host font measurement at runtime.

The package versions and `catalogVersion` move together. Any data or asset change also changes `catalogRevision`. Consumers should record both values in render metadata; the semantic equality test verifies that the Cargo and npm artifacts contain the same catalog and metadata.

## Validation

Run the complete local gate with:

```sh
npm ci
npm run validate
npm run generate:check
npm test
npm run typecheck
cargo test --workspace --locked
cargo clippy --workspace --all-targets --locked -- -D warnings
cargo doc --workspace --no-deps --locked
```

The complete fixture exercises every required field. Security fixtures prove rejection of script, event-handler, and external-reference SVGs. Catalog completeness, palette contrast, distinct node-kind fallback icons, deterministic wide-character metrics, and embedded Cargo/npm asset parity are also enforced.
