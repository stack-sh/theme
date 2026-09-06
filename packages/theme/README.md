# @stack-sh/theme

`@stack-sh/theme` exposes the typed Stack theme catalog and embeds the same generated catalog revision as the `stack-theme` Cargo crate.

The package is browser-safe and performs no filesystem, network, clock, locale, or host-font access. See the repository's [`CONTRACT.md`](https://github.com/stack-sh/theme/blob/main/CONTRACT.md) for the core catalog and [`PROVIDER_PACKS.md`](https://github.com/stack-sh/theme/blob/main/PROVIDER_PACKS.md) for the local provider-pack contract.

Catalog `0.8.0` includes 30 provider-neutral explicit icons shared by the `default`, `light`, and `dark` themes. Resolve a core icon's catalog asset path through `iconSvg()`; do not treat a logical icon identifier as a filesystem path or URL.

`themeOverridesSchema` describes palette-only user theme definitions. A user may add any valid theme identifier or intentionally shadow `default`, `light`, or `dark`; `extends` always reads one of the original built-in themes. The Rust package owns resolution and warning behavior, while this generated package exposes the shared schema and TypeScript types for browser configuration editors.

`providerPackSchema` describes manifests produced from a provider archive that the user explicitly imports. It requires local-only processing, disabled package redistribution, provider-prefixed icon IDs, source and processed hashes, artwork-preservation policy, and user-visible terms notices. The package contains no vendor asset bytes and never downloads or uploads an archive.
