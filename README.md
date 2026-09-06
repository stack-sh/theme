# Stack Theme

`stack-sh/theme` is the canonical public contract for Stack diagram themes, icons, font metrics, and local provider icon packs.

The core catalog contract is defined by [`CONTRACT.md`](./CONTRACT.md) and [`schemas/catalog.schema.json`](./schemas/catalog.schema.json). The separate local-only provider-pack contract is defined by [`PROVIDER_PACKS.md`](./PROVIDER_PACKS.md) and [`schemas/provider-pack.schema.json`](./schemas/provider-pack.schema.json). The canonical core source is [`catalog/catalog.json`](./catalog/catalog.json); Rust and JavaScript package trees are generated from that source with one content revision.

The current `0.7.0` catalog contains the core `default`, `light`, and `dark` themes, repository-authored fallbacks for every Stack 1.0 node kind, 30 provider-neutral explicit icons, and versioned host-independent font metrics. The explicit icon catalog covers clients and compute, networking and delivery, data and events, development workflows, security, general collaboration tools, and AI systems. Its identifiers are `api`, `web`, `mobile`, `desktop`, `server`, `container`, `cluster`, `cloud`, `scheduler`, `webhook`, `identity`, `observability`, `gateway`, `load-balancer`, `dns`, `cdn`, `firewall`, `network`, `event`, `stream`, `search`, `analytics`, `repository`, `pipeline`, `secret`, `document`, `task`, `chat`, `email`, and `ai`.

Provider-specific assets are not bundled. The provider-pack contract lets a CLI or browser validate an archive that the user explicitly selected from the provider's official source, keep it local, preserve the artwork, and carry source and terms notices into diagram output.

## Cargo package

Add the Rust catalog from crates.io with:

```sh
cargo add stack-theme@0.7.0
```

The package supports Rust 1.85 or newer and includes only the generated catalog API, repository-authored SVG assets, public schemas, package documentation, and the Apache-2.0 license.

Read a core theme and its semantic color tokens without filesystem or network access:

```rust
fn main() {
    let catalog = stack_theme::catalog();
    let default_theme = catalog.themes.iter().find(|theme| theme.id == "default");

    assert_eq!(catalog.catalog_version, stack_theme::CATALOG_VERSION);
    assert!(default_theme.is_some());
}
```

See the complete [`stack-theme` API documentation](https://docs.rs/stack-theme).

## Distribution

`stack-theme` is published on crates.io. The repository also generates `packages/theme` to verify Rust/JavaScript semantic parity and to supply the browser Engine build, but `@stack-sh/theme` is not currently published as a standalone npm package. Browser applications should normally install [`@stack-sh/engine`](https://www.npmjs.com/package/@stack-sh/engine), which embeds the matching catalog.

## Scope

This repository owns:

- the versioned core theme catalog;
- icon metadata and SVG-safe icon assets;
- deterministic font metrics used by the layout engine;
- equivalent Rust and JavaScript package trees generated from the same catalog data;
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

Maintainers use the [trusted publishing procedure](./docs/releasing.md#ongoing-trusted-publishing) for subsequent crates.io releases. See the [0.7.0 release notes](./docs/releases/v0.7.0.md) for the cache card update.
