# Stack Theme

`stack-sh/theme` is the canonical public contract for Stack diagram themes, icons, font metrics, and local provider icon packs.

The draft core catalog contract is defined by [`CONTRACT.md`](./CONTRACT.md) and [`schemas/catalog.schema.json`](./schemas/catalog.schema.json). The separate local-only provider-pack contract is defined by [`PROVIDER_PACKS.md`](./PROVIDER_PACKS.md) and [`schemas/provider-pack.schema.json`](./schemas/provider-pack.schema.json). The canonical core source is [`catalog/catalog.json`](./catalog/catalog.json); Cargo and npm artifacts are generated from that source with one content revision.

The current `0.3.0` catalog contains the core `default`, `light`, and `dark` themes, repository-authored fallbacks for every Stack 1.0 node kind, 12 provider-neutral explicit icons, and versioned host-independent font metrics. The explicit icon identifiers are `api`, `web`, `mobile`, `desktop`, `server`, `container`, `cluster`, `cloud`, `scheduler`, `webhook`, `identity`, and `observability`. Neither package has been released to a registry yet.

Provider-specific assets are not bundled. The provider-pack contract lets a CLI or browser validate an archive that the user explicitly selected from the provider's official source, keep it local, preserve the artwork, and carry source and terms notices into diagram output.

## Scope

This repository will own:

- the versioned core theme catalog;
- icon metadata and SVG-safe icon assets;
- deterministic font metrics used by the layout engine;
- equivalent Rust and npm artifacts generated from the same catalog data.
- a provider-neutral manifest and validation contract for user-imported vendor icons.

It does not own the Stack language, compilation, layout, SVG rendering, user authentication, billing, entitlement checks, or paid-theme delivery.

Only free, repository-authored core themes and assets belong in this public repository. Vendor asset bytes, paid themes, and proprietary delivery do not.

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

The local [core theme review](./review/index.html) renders every fallback without a build step. Serve the repository root over HTTP, open `/review/`, and compare all three themes before changing palettes, fallback shapes, icons, or typography metrics. The current review record is in [`docs/core-theme-review.md`](./docs/core-theme-review.md).

## Licensing

Repository-authored source code, catalog data, and assets are licensed under the [Apache License 2.0](./LICENSE).

Third-party fonts, icons, and other assets keep their own licenses and are not relicensed under Apache-2.0. Their provenance and redistribution terms must be recorded in [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md) before they are committed. Current provider icons are user-imported and are never committed or copied into the Cargo or npm packages.
