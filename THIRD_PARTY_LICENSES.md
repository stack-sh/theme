# Third-party licenses

No third-party fonts, icons, or other runtime assets are bundled in this repository. The 30 theme-specific fallback SVGs, 12 shared explicit icon SVGs, and `stack_sans` metrics are repository-authored Apache-2.0 work with provenance recorded in the canonical catalog.

The repository uses the following third-party libraries:

| Project | Version | Use | Source | Copyright | License | Distribution |
| --- | --- | --- | --- | --- | --- | --- |
| Ajv | 8.20.0 | Development-only JSON Schema validation | https://github.com/ajv-validator/ajv/tree/v8.20.0 | Evgeny Poberezkin | MIT | Installed by `npm ci`; not included in `@stack-sh/theme` |
| saxes | 6.0.0 | Development-only streaming XML parser for SVG validation | https://github.com/lddubeau/saxes/tree/v6.0.0 | Louis-Dominique Dubeau | ISC | Installed by `npm ci`; not included in `@stack-sh/theme` |
| TypeScript | 7.0.2 | Development-only npm declaration checking | https://github.com/microsoft/TypeScript/tree/v7.0.2 | Microsoft Corporation | Apache-2.0 | Installed by `npm ci`; not included in `@stack-sh/theme` |
| serde | 1.0.229 | Rust catalog deserialization and public data types | https://github.com/serde-rs/serde/tree/v1.0.229 | David Tolnay | MIT OR Apache-2.0 | Cargo dependency; no separately bundled asset |
| serde_json | 1.0.151 | Embedded JSON catalog deserialization | https://github.com/serde-rs/json/tree/v1.0.151 | David Tolnay | MIT OR Apache-2.0 | Cargo dependency; no separately bundled asset |

Ajv, saxes, and TypeScript retain their upstream licenses in installed package metadata and the npm lockfile. serde and serde_json retain their upstream Cargo package metadata and license terms. No dependency source or license text is copied into either generated distribution package by this repository.

Before adding a third-party asset, record all of the following in this file:

- project and asset name;
- canonical source URL and pinned version or revision;
- copyright holder;
- exact SPDX license expression, when available;
- required license text and attribution;
- whether the asset was modified;
- redistribution conditions for Cargo, npm, WASM, and commercial applications.

License texts required by an upstream project must be stored alongside the relevant asset or in a clearly referenced license directory. Font licenses such as the SIL Open Font License must remain attached to the font distribution and must not be replaced by this repository's Apache-2.0 license.
