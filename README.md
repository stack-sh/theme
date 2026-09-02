# Stack Theme

`stack-sh/theme` is the canonical public catalog for Stack diagram themes, icons, and font metrics.

This repository currently contains only its repository foundation. Theme schemas, package APIs, and compatibility guarantees are not stable until their public contract is added in a later change.

## Scope

This repository will own:

- the versioned core theme catalog;
- icon metadata and SVG-safe icon assets;
- deterministic font metrics used by the layout engine;
- equivalent Rust and npm artifacts generated from the same catalog data.

It does not own the Stack language, compilation, layout, SVG rendering, user authentication, billing, entitlement checks, or paid-theme delivery.

Only free core themes belong in this public repository. Paid or proprietary theme bundles must be stored and distributed separately under their own terms.

## Development

Repository checks currently validate the foundation files on every push and pull request. Source-specific formatting, tests, builds, and package validation will be added together with the first catalog implementation.

## Licensing

Repository-authored source code, catalog data, and assets are licensed under the [Apache License 2.0](./LICENSE).

Third-party fonts, icons, and other assets keep their own licenses and are not relicensed under Apache-2.0. Their provenance and redistribution terms must be recorded in [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md) before they are committed.
