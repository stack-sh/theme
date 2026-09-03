# Core theme review

Review date: 2026-09-03

Catalog version: `0.1.0`

Catalog revision: `sha256:b54ca3435931675d36d6a69b5154a0bd6ce2cbae1cfe14a20a095a8e24f8bae4`

## Automated evidence

- The catalog validator accepts `default`, `light`, and `dark` with all ten Stack 1.0 node-kind fallbacks and explicit recovery through `default` / `kind-external` for missing non-core themes or icons.
- Each theme uses ten distinct logical icon identifiers and at least four fallback shapes, so kinds remain distinguishable without color.
- Text and danger colors meet a `4.5:1` contrast floor against the surface. Borders, accents, and connectors meet a `3:1` non-text contrast floor.
- The deterministic `stack_sans` metrics cover explicit narrow glyphs, default advances, pinned wide Unicode ranges, CJK, and emoji without host font measurement.
- Cargo and npm artifacts expose identical catalog, schema, assets, version, and content revision data.
- SVG validation rejects scripts, event handlers, external resources, and executable URL values.

## Visual evidence

The dependency-free review page was served from the repository root and checked in headless Chromium at `1440 x 1000` and `390 x 844` CSS pixels.

- All three theme sections, 30 node fallbacks, and 30 embedded SVG icons rendered.
- Every node kind retained a recognizable subject and a non-color shape cue in each theme.
- The Japanese and emoji typography sample rendered within every theme card.
- The narrow viewport had no horizontal overflow after wrapping the content revision metadata.
- The browser console and page-error log were empty at both viewports.

## License evidence

All runtime SVG assets and the deterministic metrics table are repository-authored Apache-2.0 work. No third-party runtime font, icon, or image is bundled. Development dependencies remain listed in [`THIRD_PARTY_LICENSES.md`](../THIRD_PARTY_LICENSES.md).
