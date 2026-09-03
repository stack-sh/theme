import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  readJson,
  repositoryRoot,
  validateCatalog,
  validateSvgText,
} from "../scripts/catalog-lib.mjs";
import {
  catalog,
  catalogRevision,
  catalogVersion,
  iconAssets,
  iconSvg,
} from "../packages/theme/index.js";

test("the complete contract fixture is valid", async () => {
  const fixture = await readJson(
    path.join(repositoryRoot, "tests/fixtures/catalog/valid.json"),
  );
  await validateCatalog(fixture);
});

for (const [name, pattern] of [
  ["unsafe-script.svg", /element script is not allowed/],
  ["unsafe-event.svg", /event handler attribute onload is forbidden/],
  ["unsafe-external-reference.svg", /element image is not allowed/],
  ["unsafe-url.svg", /external or executable reference in fill is forbidden/],
]) {
  test(`unsafe SVG fixture ${name} is rejected`, async () => {
    const svg = await readFile(
      path.join(repositoryRoot, "tests/fixtures/assets", name),
      "utf8",
    );
    assert.throws(() => validateSvgText(svg, name, [0, 0, 24, 24]), pattern);
  });
}

test("unknown fallback icons are rejected", async () => {
  const fixture = await readJson(
    path.join(repositoryRoot, "tests/fixtures/catalog/valid.json"),
  );
  fixture.themes[0].nodeKindFallbacks.actor.fallbackIconId = "missing";
  await assert.rejects(
    validateCatalog(fixture),
    /actor fallback references unknown icon missing/,
  );
});

test("Cargo and npm artifacts expose one semantic catalog revision", async () => {
  const sourceCatalog = await readJson(
    path.join(repositoryRoot, "catalog/catalog.json"),
  );
  const cargoCatalog = await readJson(
    path.join(
      repositoryRoot,
      "crates/stack-theme/src/generated/catalog.json",
    ),
  );
  const npmCatalog = await readJson(
    path.join(repositoryRoot, "packages/theme/catalog.json"),
  );
  const sourceSchema = await readJson(
    path.join(repositoryRoot, "schemas/catalog.schema.json"),
  );
  const cargoSchema = await readJson(
    path.join(repositoryRoot, "crates/stack-theme/schema/catalog.schema.json"),
  );
  const npmSchema = await readJson(
    path.join(repositoryRoot, "packages/theme/schema/catalog.schema.json"),
  );
  const metadata = await readJson(
    path.join(repositoryRoot, "packages/theme/catalog-metadata.json"),
  );
  const rustMetadata = await readFile(
    path.join(
      repositoryRoot,
      "crates/stack-theme/src/generated/metadata.rs",
    ),
    "utf8",
  );

  assert.deepEqual(cargoCatalog, sourceCatalog);
  assert.deepEqual(cargoCatalog, npmCatalog);
  assert.deepEqual(cargoSchema, sourceSchema);
  assert.deepEqual(cargoSchema, npmSchema);
  assert.deepEqual(catalog, npmCatalog);
  assert.equal(catalogVersion, npmCatalog.catalogVersion);
  assert.equal(metadata.catalogVersion, catalogVersion);
  assert.equal(metadata.catalogRevision, catalogRevision);
  assert.match(
    rustMetadata,
    new RegExp(`CATALOG_VERSION: &str = "${catalogVersion}"`),
  );
  assert.match(
    rustMetadata,
    new RegExp(`CATALOG_REVISION: &str = "${catalogRevision}"`),
  );
  assert.match(catalogRevision, /^sha256:[0-9a-f]{64}$/);
  assert.deepEqual(iconAssets, {});
  assert.equal(iconSvg("assets/missing.svg"), undefined);
});
