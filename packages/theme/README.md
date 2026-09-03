# @stack-sh/theme

`@stack-sh/theme` exposes the typed Stack theme catalog and embeds the same generated catalog revision as the `stack-theme` Cargo crate.

The package is browser-safe and performs no filesystem, network, clock, locale, or host-font access. See the repository's [`CONTRACT.md`](https://github.com/stack-sh/theme/blob/main/CONTRACT.md) for the catalog and compatibility contract.

Catalog `0.2.0` includes 12 provider-neutral explicit icons shared by the `default`, `light`, and `dark` themes. Resolve an icon's catalog asset path through `iconSvg()`; do not treat a logical icon identifier as a filesystem path or URL.
