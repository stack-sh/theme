# stack-theme

`stack-theme` exposes the typed Stack theme catalog and embeds the same generated catalog revision as the `@stack-sh/theme` npm package.

The public contract and compatibility policy are documented in the repository's [`CONTRACT.md`](https://github.com/stack-sh/theme/blob/main/CONTRACT.md).

Add version 0.8.0 from crates.io with `cargo add stack-theme@0.8.0`. The package supports Rust 1.85 or newer. `resolve_theme_overrides()` applies palette-only user definitions over the original built-in catalog, including intentional overrides of `default`, `light`, and `dark`.
