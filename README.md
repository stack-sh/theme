# Stack Theme

`stack-sh/theme` is the canonical public catalog for Stack diagram themes, icons, and font metrics.

The draft catalog contract is defined by [`CONTRACT.md`](./CONTRACT.md) and [`schemas/catalog.schema.json`](./schemas/catalog.schema.json). The canonical source is [`catalog/catalog.json`](./catalog/catalog.json); Cargo and npm artifacts are generated from that source with one content revision.

The current `0.1.0` catalog is intentionally empty. The core `default`, `light`, and `dark` themes will be added as the next reviewed catalog change before either package is released to a registry.

## Scope

This repository will own:

- the versioned core theme catalog;
- icon metadata and SVG-safe icon assets;
- deterministic font metrics used by the layout engine;
- equivalent Rust and npm artifacts generated from the same catalog data.

It does not own the Stack language, compilation, layout, SVG rendering, user authentication, billing, entitlement checks, or paid-theme delivery.

Only free core themes belong in this public repository. Paid or proprietary theme bundles must be stored and distributed separately under their own terms.

## Development

Install Node.js 20 or newer and Rust 1.85, then run:

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

`npm run generate` is the only supported way to update checked-in package copies and revision metadata. CI validates the schema and asset boundary, rejects unsafe SVG fixtures, compares Cargo and npm catalog semantics, builds both packages, and verifies the minimum Rust version.

## Licensing

Repository-authored source code, catalog data, and assets are licensed under the [Apache License 2.0](./LICENSE).

Third-party fonts, icons, and other assets keep their own licenses and are not relicensed under Apache-2.0. Their provenance and redistribution terms must be recorded in [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md) before they are committed.
