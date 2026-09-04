# User-imported provider icon packs

## Status and boundary

This document defines the draft `1.0` manifest for provider icons that a user imports from an official archive. It is separate from the core theme catalog because current AWS, Google Cloud, and Azure terms permit architecture-diagram use but do not provide a clear license for Stack to redistribute the asset bytes in Cargo, npm, Web, WebAssembly, or native binary packages.

The Stack repository and packages contain only the Apache-2.0 manifest schema, types, and validation logic. They never contain, mirror, proxy, automatically download, or upload provider asset bytes. A host application must ask the user to select a local archive and accept the linked provider terms before creating a pack.

## Manifest identity

Every manifest requires:

- `schemaVersion` and a semantically versioned `packVersion`;
- one lowercase provider `id`, human-readable name, and matching icon namespace;
- `distributionMode: "user-imported"`;
- the official source page, archive URL, archive SHA-256, upstream release, retrieval date, terms URL, terms-review date, copyright statement, and `LicenseRef-*` identifier;
- a rights record that fixes package redistribution, automatic download, and server upload to `false`, generated diagram embedding to `true`, and artwork preservation to `true`;
- user-visible attribution, terms summary, and non-endorsement notice;
- one or more provider-prefixed icon records.

The schema records `archiveUrl` as provenance. It is not permission for a runtime consumer to fetch the URL. Import remains an explicit user-selected local operation.

## Icon records

An icon ID has the form `<provider>:<slug>`, such as `aws:s3`, `gcp:cloud-run`, or `azure:storage-accounts`. The prefix must equal `provider.id`. Each icon preserves a stable subject, official product name, recommended Stack node kind, upstream archive path, processed local SVG path, integer view box, original and processed SHA-256 hashes, and an ordered transformation log.

The importer may perform only visual-preservation transformations needed for safe standalone SVG, such as removing metadata, converting stylesheet declarations to equivalent presentation attributes, removing unused identifiers, namespacing referenced gradient identifiers to prevent collisions, or normalizing XML. Recoloring, cropping, flipping, rotation, distortion, product substitution, or aspect-ratio changes are outside the contract.

An empty transformation list requires identical original and processed hashes. A changed hash requires at least one declared transformation. The processed SVG must pass the same script, event-handler, external-reference, executable URL, and viewport safety checks as core assets. Gradients may use only locally declared, `stack-`-namespaced identifiers; stylesheets and external references remain forbidden.

## Terms and output

`rights.permittedOutputs` is copied from the reviewed provider terms rather than inferred from Stack's Apache-2.0 license. The manifest requires explicit acceptance of those linked terms. A renderer may embed an icon only in a listed output type and must preserve the official artwork.

Rendered output should record provider ID, icon ID, official product name, upstream release, archive hash, terms URL, and pack revision. The CLI should emit a human-readable notice sidecar containing the manifest notice and every used asset. The product name should appear near the icon when the provider guidance recommends or requires it.

Terms can change independently of a pack. Hosts must display the review date and source link, warn after `reviewAfter`, and allow a pack to be removed without changing the core catalog. A provider pack never overrides a core icon ID or another provider namespace.

## Validation

Repository validation covers JSON Schema shape, namespace equality, duplicate IDs and paths, source and processed hashes, transformation evidence, path containment, file presence, SVG safety, and Cargo/npm schema equality. No test fixture uses a real provider asset.

Run:

```sh
npm run validate
npm test
npm run generate:check
npm run typecheck
cargo test --workspace --locked
```
