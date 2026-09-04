# Repository Guide

## Language

Write repository content, code comments, commit messages, issues, and pull requests in English.

## Scope

- Keep this repository limited to the public core theme catalog, icons, font metrics, user-imported provider-pack contract, and their Rust and npm distribution artifacts.
- Keep parsing, validation, layout, and SVG rendering in their owning repositories.
- Do not add authentication, billing, entitlement, network access, paid themes, or customer data.
- Do not publish a theme schema or compatibility promise before its public contract and conformance data are reviewed.

## Licensing

- Treat repository-authored work as Apache-2.0 unless a file explicitly states otherwise.
- Before adding a third-party font, icon, or asset, record its source, copyright holder, exact license, required license text, attribution, modification status, and redistribution conditions in `THIRD_PARTY_LICENSES.md`.
- Do not commit an asset with unclear provenance, incompatible terms, or restrictions that prevent the intended Cargo, npm, WASM, or commercial application distribution.
- Keep vendor assets with custom terms out of the core catalog and generated packages. A user-imported provider pack may reference local assets only when its manifest preserves source, terms, hashes, artwork policy, and notice data.
- Do not add paid or proprietary theme delivery.

## Delivery

- Use a topic branch and pull request; squash merge after approval.
- Add the smallest relevant formatting, validation, test, and build gates when source or package files are introduced.
- Keep credentials, tokens, private keys, signing material, and customer data out of Git.
