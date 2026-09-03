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

const nodeKinds = [
  "actor",
  "client",
  "service",
  "function",
  "worker",
  "database",
  "cache",
  "queue",
  "storage",
  "external",
];

function linearChannel(channel) {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(color) {
  const channels = color
    .slice(1, 7)
    .match(/.{2}/g)
    .map((channel) => linearChannel(Number.parseInt(channel, 16)));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(left, right) {
  const lighter = Math.max(luminance(left), luminance(right));
  const darker = Math.min(luminance(left), luminance(right));
  return (lighter + 0.05) / (darker + 0.05);
}

test("the three core themes provide distinct fallback visuals", () => {
  assert.deepEqual(
    catalog.themes.map((theme) => theme.id),
    ["default", "light", "dark"],
  );

  assert.deepEqual(catalog.fallbacks, {
    missingThemeId: "default",
    missingIconId: "kind-external",
  });
  const logicalIconSubjects = new Map();

  for (const theme of catalog.themes) {
    assert.deepEqual(Object.keys(theme.nodeKindFallbacks), nodeKinds);
    assert.equal(
      new Set(
        Object.values(theme.nodeKindFallbacks).map(
          (fallback) => fallback.fallbackIconId,
        ),
      ).size,
      nodeKinds.length,
    );
    assert.ok(
      new Set(
        Object.values(theme.nodeKindFallbacks).map((fallback) => fallback.shape),
      ).size >= 4,
    );
    for (const icon of theme.icons) {
      assert.equal(typeof iconSvg(icon.asset.path), "string");
      const existingSubject = logicalIconSubjects.get(icon.id);
      if (existingSubject !== undefined) {
        assert.equal(icon.subject, existingSubject);
      }
      logicalIconSubjects.set(icon.id, icon.subject);
    }
    assert.ok(
      theme.icons.some((icon) => icon.id === catalog.fallbacks.missingIconId),
    );
  }
});

test("unknown catalog fallback targets are rejected", async () => {
  const fixture = await readJson(
    path.join(repositoryRoot, "tests/fixtures/catalog/valid.json"),
  );
  fixture.fallbacks.missingThemeId = "missing";
  await assert.rejects(
    validateCatalog(fixture),
    /catalog fallback references unknown theme missing/,
  );
});

test("core palettes meet text and non-text contrast floors", () => {
  for (const theme of catalog.themes) {
    const { palette } = theme;
    for (const foreground of ["text", "textMuted", "danger"]) {
      assert.ok(
        contrast(palette[foreground], palette.surface) >= 4.5,
        `${theme.id} ${foreground} contrast is below 4.5:1`,
      );
    }
    for (const foreground of ["border", "accent"]) {
      assert.ok(
        contrast(palette[foreground], palette.surface) >= 3,
        `${theme.id} ${foreground} contrast is below 3:1`,
      );
    }
    assert.ok(
      contrast(palette.connector, palette.canvas) >= 3,
      `${theme.id} connector contrast is below 3:1`,
    );
  }
});

test("font metrics cover narrow, explicit, and wide scalar advances", () => {
  const metrics = catalog.fontMetrics.find((entry) => entry.id === "stack_sans");
  assert.ok(metrics);

  const advance = (scalar) => {
    const key = `U+${scalar.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`;
    const explicit = metrics.glyphAdvances[key];
    if (explicit !== undefined) return explicit;
    const codePoint = scalar.codePointAt(0);
    const isWide = metrics.wideRanges.some(
      (range) =>
        codePoint >= Number.parseInt(range.start.slice(2), 16) &&
        codePoint <= Number.parseInt(range.end.slice(2), 16),
    );
    return isWide ? metrics.wideAdvance : metrics.defaultAdvance;
  };

  assert.equal(advance(" "), 250);
  assert.equal(advance("A"), 600);
  assert.equal(advance("日"), 1000);
  assert.equal(advance("🚀"), 1000);
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
  assert.equal(Object.keys(iconAssets).length, 30);
  assert.equal(iconSvg("assets/missing.svg"), undefined);
});
