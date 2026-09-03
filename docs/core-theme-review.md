# Core theme review

Review date: 2026-09-04

Catalog version: `0.2.0`

Catalog revision: `sha256:d3a8a5a9d2100e496af3fd7adf389788f4a77508bf749a108183a2abf8f681e1`

## Automated evidence

- The catalog validator accepts `default`, `light`, and `dark` with all ten Stack 1.0 node-kind fallbacks and explicit recovery through `default` / `kind-external` for missing non-core themes or icons.
- Each theme uses ten distinct logical icon identifiers and at least four fallback shapes, so kinds remain distinguishable without color.
- Each theme exposes the same 12 provider-neutral explicit icon identifiers and subjects. Their 36 catalog references resolve to 12 shared, repository-authored SVG assets with identical metadata.
- Text and danger colors meet a `4.5:1` contrast floor against the surface. Borders, accents, and connectors meet a `3:1` non-text contrast floor.
- The deterministic `stack_sans` metrics cover explicit narrow glyphs, default advances, pinned wide Unicode ranges, CJK, and emoji without host font measurement.
- Cargo and npm artifacts expose identical catalog, schema, assets, version, and content revision data.
- SVG validation rejects scripts, event handlers, external resources, and executable URL values.

## Visual evidence

The dependency-free review page was served from the repository root and checked in isolated headless Chrome at `1440 x 1000` and `390 x 844` CSS pixels.

- All three theme sections, 30 node fallbacks, 36 explicit icon cards, and 66 embedded SVG references rendered.
- The 12 explicit identifiers appeared once and in the same order in every theme; every SVG retained `currentColor` styling.
- Every node kind retained a recognizable subject and a non-color shape cue in each theme.
- The Japanese and emoji typography sample rendered within every theme card.
- Both viewports had no horizontal overflow or clipped explicit icon card, and the heading order remained `h1` → `h2` → `h3`.
- Browser console warnings and errors, page errors, and failed network requests were empty at both viewports.

## License evidence

All 42 unique runtime SVG assets and the deterministic metrics table are repository-authored Apache-2.0 work. No third-party runtime font, icon, or image is bundled. Development dependencies remain listed in [`THIRD_PARTY_LICENSES.md`](../THIRD_PARTY_LICENSES.md).
