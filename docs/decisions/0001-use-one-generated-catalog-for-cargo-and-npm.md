# ADR-0001: Use One Generated Catalog for Cargo and npm

## Status

Accepted

## Date

2026-09-03

## Context

The native engine and browser WASM adapter must resolve the same theme, icon, and font metric data without host I/O. Independent Rust and JavaScript catalogs would make visual drift possible even when both packages use the same semantic version. Using a Git commit as embedded revision metadata would require a build-time Git checkout and would create a self-referential value for checked-in artifacts.

SVG assets also cross a security and licensing boundary. A renderer cannot safely inline arbitrary markup or fetch resources named by Stack source. Asset provenance must travel with the canonical catalog and be validated before either package exposes it.

## Decision

`catalog/catalog.json` and its referenced repository assets are the only source catalog. JSON Schema defines the portable document shape. A repository validator enforces referential integrity, identifier registration, cross-theme icon subject consistency, distribution permission, license-file presence, and an SVG element and attribute allowlist.

One generator normalizes the catalog, hashes the normalized JSON plus path-ordered SVG bytes, and writes equivalent Cargo and npm artifacts with the same catalog version and `sha256:` revision. Generated artifacts are committed and verified in CI. Runtime APIs use only embedded data.

All layout-affecting dimensions and font measurements use integers. Font metrics provide a deterministic default advance for Unicode scalars not listed explicitly.

## Consequences

- Rust, native, WASM, and JavaScript consumers can record one reproducible catalog identity.
- Package generation is deterministic and does not depend on Git metadata.
- A source or asset change requires regenerated artifacts and changes the revision.
- The repository owns validation tooling, while renderers consume only already validated data.
- Catalog package versions move together, so Cargo and npm releases must be coordinated.
- The initial contract catalog may be empty; required core themes are added and visually reviewed in the next change before any registry release.

## Alternatives Considered

### Maintain handwritten package-specific catalogs

- Pros: No generation step.
- Cons: Semantic equality depends on manual synchronization.
- Rejected: Cross-runtime visual parity is a core requirement.

### Embed the Git commit SHA

- Pros: Direct link to repository history.
- Cons: Checked-in generated files cannot include the commit that contains them, and package builds would require Git metadata.
- Rejected: A content revision is self-contained and reproducible.

### Allow runtime theme or icon loading

- Pros: Third parties can add assets without rebuilding packages.
- Cons: Introduces filesystem or network behavior, weakens provenance enforcement, and makes native/WASM output depend on the host.
- Rejected: The first engine requires a fully installed, versioned catalog.
