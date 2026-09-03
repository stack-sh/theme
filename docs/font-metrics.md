# Stack Sans Deterministic Metrics

`stack_sans` version `stack-metrics-1` is a repository-authored layout table for the generic CSS `system-ui` rendering preference. It is not extracted from, and does not redistribute, a font file.

The table exists to make layout decisions independent from the font installed on a native or browser host. Consumers choose an advance in this order:

1. an exact uppercase `U+XXXX` entry in `glyphAdvances`;
2. `wideAdvance` when the scalar is in one of the inclusive, ordered `wideRanges`;
3. `defaultAdvance` for every other scalar.

The first version gives narrow Latin punctuation explicit advances, uses a 600-unit default for ordinary alphabetic text, and uses a 1000-unit advance for Hangul, CJK, full-width forms, emoji, and supplementary ideographs. It uses 1000 units per em, an 800-unit ascent, a -200-unit descent, and a 200-unit line gap.

These values are intentionally conservative layout inputs rather than claims about the exact glyph geometry of every platform `system-ui` font. Renderers use them for bounds and wrapping and must not call a host font measurement API. A future metrics adjustment changes the metrics version and catalog revision.

The table is repository-authored work licensed under Apache-2.0. It requires no third-party font attribution or redistribution permission.
