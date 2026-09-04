# @stack-sh/theme

`@stack-sh/theme` exposes the typed Stack theme catalog and embeds the same generated catalog revision as the `stack-theme` Cargo crate.

The package is browser-safe and performs no filesystem, network, clock, locale, or host-font access. See the repository's [`CONTRACT.md`](https://github.com/stack-sh/theme/blob/main/CONTRACT.md) for the core catalog and [`PROVIDER_PACKS.md`](https://github.com/stack-sh/theme/blob/main/PROVIDER_PACKS.md) for the local provider-pack contract.

Catalog `0.3.0` includes 12 provider-neutral explicit icons shared by the `default`, `light`, and `dark` themes. Resolve a core icon's catalog asset path through `iconSvg()`; do not treat a logical icon identifier as a filesystem path or URL.

`providerPackSchema` describes manifests produced from a provider archive that the user explicitly imports. It requires local-only processing, disabled package redistribution, provider-prefixed icon IDs, source and processed hashes, artwork-preservation policy, and user-visible terms notices. The package contains no vendor asset bytes and never downloads or uploads an archive.
