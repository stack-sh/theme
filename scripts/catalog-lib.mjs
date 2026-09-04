import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import { SaxesParser } from "saxes";

export const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const allowedElements = new Set([
  "circle",
  "desc",
  "defs",
  "ellipse",
  "g",
  "line",
  "linearGradient",
  "path",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "stop",
  "svg",
  "title",
]);

const gradientElements = new Set(["linearGradient", "radialGradient"]);

const allowedAttributes = new Set([
  "aria-hidden",
  "clip-rule",
  "cx",
  "cy",
  "d",
  "fill",
  "fill-rule",
  "height",
  "id",
  "opacity",
  "offset",
  "points",
  "r",
  "role",
  "rx",
  "ry",
  "stroke",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-width",
  "stop-color",
  "stop-opacity",
  "transform",
  "gradientTransform",
  "gradientUnits",
  "viewBox",
  "width",
  "x",
  "x1",
  "x2",
  "xmlns",
  "y",
  "y1",
  "y2",
]);

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

function unicodeScalar(label) {
  return Number.parseInt(label.slice(2), 16);
}

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export function formatJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function fail(message) {
  throw new Error(message);
}

function resolveRepositoryPath(root, relativePath, label) {
  const resolved = path.resolve(root, relativePath);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(`${label} leaves the repository: ${relativePath}`);
  }
  return resolved;
}

async function requireFile(filePath, label) {
  let fileStat;
  try {
    fileStat = await stat(filePath);
  } catch {
    fail(`${label} does not exist: ${filePath}`);
  }
  if (!fileStat.isFile()) {
    fail(`${label} is not a file: ${filePath}`);
  }
}

function validateAttribute(
  element,
  name,
  value,
  assetPath,
  declaredIdentifiers,
  referencedIdentifiers,
) {
  if (/^on/i.test(name)) {
    fail(`${assetPath}: event handler attribute ${name} is forbidden`);
  }
  if (name.includes(":")) {
    fail(`${assetPath}: namespaced attribute ${name} is forbidden`);
  }
  if (!allowedAttributes.has(name)) {
    fail(`${assetPath}: attribute ${name} on ${element} is not allowed`);
  }
  if (name === "xmlns") {
    if (element !== "svg" || value !== "http://www.w3.org/2000/svg") {
      fail(`${assetPath}: only the canonical SVG namespace is allowed`);
    }
    return;
  }
  if (name === "id") {
    if (!gradientElements.has(element)) {
      fail(`${assetPath}: only gradient elements may declare identifiers`);
    }
    if (!/^stack-[a-z0-9][a-z0-9-]{0,126}$/.test(value)) {
      fail(`${assetPath}: gradient identifier must use the stack- namespace`);
    }
    if (declaredIdentifiers.has(value)) {
      fail(`${assetPath}: duplicate identifier ${value}`);
    }
    declaredIdentifiers.add(value);
    return;
  }
  if (/url\s*\(/i.test(value)) {
    const localReference = value.match(/^url\(#(stack-[a-z0-9][a-z0-9-]{0,126})\)$/);
    if ((name !== "fill" && name !== "stroke") || localReference === null) {
      fail(`${assetPath}: external or executable reference in ${name} is forbidden`);
    }
    referencedIdentifiers.add(localReference[1]);
    return;
  }
  if (/url\s*\(|javascript:|data:|https?:\/\/|\/\//i.test(value)) {
    fail(`${assetPath}: external or executable reference in ${name} is forbidden`);
  }
}

export function validateSvgText(svg, assetPath, expectedViewBox) {
  if (/<!DOCTYPE|<!ENTITY|<\?/i.test(svg)) {
    fail(`${assetPath}: declarations, entities, and processing instructions are forbidden`);
  }

  const parser = new SaxesParser({ xmlns: false });
  const elementStack = [];
  const declaredIdentifiers = new Set();
  const referencedIdentifiers = new Set();
  let rootCount = 0;
  let rootNamespace;
  let rootViewBox;
  let parseError;

  parser.on("opentag", (tag) => {
    if (!allowedElements.has(tag.name)) {
      fail(`${assetPath}: element ${tag.name} is not allowed`);
    }
    if (elementStack.length === 0) {
      rootCount += 1;
      if (tag.name !== "svg") {
        fail(`${assetPath}: root element must be svg`);
      }
      rootNamespace = tag.attributes.xmlns;
      rootViewBox = tag.attributes.viewBox;
    } else if (tag.name === "svg") {
      fail(`${assetPath}: nested svg elements are forbidden`);
    }
    const parent = elementStack.at(-1);
    if (tag.name === "defs" && parent !== "svg") {
      fail(`${assetPath}: defs must be a direct child of svg`);
    }
    if (gradientElements.has(tag.name) && parent !== "defs") {
      fail(`${assetPath}: gradient elements must be direct children of defs`);
    }
    if (tag.name === "stop" && !gradientElements.has(parent)) {
      fail(`${assetPath}: stop must be a direct child of a gradient`);
    }
    if (parent === "defs" && !gradientElements.has(tag.name)) {
      fail(`${assetPath}: defs may contain only gradients`);
    }
    for (const [name, value] of Object.entries(tag.attributes)) {
      validateAttribute(
        tag.name,
        name,
        value,
        assetPath,
        declaredIdentifiers,
        referencedIdentifiers,
      );
    }
    elementStack.push(tag.name);
  });
  parser.on("closetag", () => {
    elementStack.pop();
  });
  parser.on("text", (text) => {
    const parent = elementStack.at(-1);
    if (text.trim() !== "" && parent !== "title" && parent !== "desc") {
      fail(`${assetPath}: visible text outside title or desc is forbidden`);
    }
  });
  parser.on("cdata", () => {
    fail(`${assetPath}: CDATA is forbidden`);
  });
  parser.on("error", (error) => {
    parseError = error;
  });

  try {
    parser.write(svg).close();
  } catch (error) {
    fail(`${assetPath}: invalid or unsafe SVG: ${error.message}`);
  }
  if (parseError) {
    fail(`${assetPath}: invalid SVG: ${parseError.message}`);
  }
  if (rootCount !== 1 || elementStack.length !== 0) {
    fail(`${assetPath}: SVG must contain exactly one complete root element`);
  }
  if (rootNamespace !== "http://www.w3.org/2000/svg") {
    fail(`${assetPath}: root must declare the canonical SVG namespace`);
  }
  for (const identifier of referencedIdentifiers) {
    if (!declaredIdentifiers.has(identifier)) {
      fail(`${assetPath}: local reference ${identifier} is not declared`);
    }
  }
  for (const identifier of declaredIdentifiers) {
    if (!referencedIdentifiers.has(identifier)) {
      fail(`${assetPath}: identifier ${identifier} is unused`);
    }
  }

  const actualViewBox = rootViewBox
    ?.trim()
    .split(/[ ,]+/)
    .map((value) => Number(value));
  if (
    !actualViewBox ||
    actualViewBox.length !== 4 ||
    actualViewBox.some((value) => !Number.isFinite(value)) ||
    actualViewBox.some((value, index) => value !== expectedViewBox[index])
  ) {
    fail(`${assetPath}: root viewBox does not match catalog metadata`);
  }
}

export async function validateCatalog(
  catalog,
  { root = repositoryRoot, validateAssets = true, requiredThemeIds = [] } = {},
) {
  const schema = await readJson(path.join(repositoryRoot, "schemas/catalog.schema.json"));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);
  if (!validate(catalog)) {
    const details = validate.errors
      .map((error) => `${error.instancePath || "/"} ${error.message}`)
      .join("; ");
    fail(`catalog schema validation failed: ${details}`);
  }

  const metricIds = new Set();
  for (const metrics of catalog.fontMetrics) {
    if (metricIds.has(metrics.id)) {
      fail(`duplicate font metrics id: ${metrics.id}`);
    }
    metricIds.add(metrics.id);
    let previousRangeEnd = -1;
    for (const range of metrics.wideRanges) {
      const start = unicodeScalar(range.start);
      const end = unicodeScalar(range.end);
      if (
        start > end ||
        end > 0x10ffff ||
        (start <= 0xdfff && end >= 0xd800) ||
        start <= previousRangeEnd
      ) {
        fail(`font metrics ${metrics.id} has invalid or overlapping wide ranges`);
      }
      previousRangeEnd = end;
    }
    if (Object.values(metrics.provenance.redistribution).some((permitted) => !permitted)) {
      fail(`font metrics ${metrics.id} is not redistributable in every supported artifact`);
    }
    if (
      metrics.provenance.licenseFile !== "LICENSE" &&
      !metrics.provenance.licenseFile.startsWith("licenses/")
    ) {
      fail(`font metrics ${metrics.id} license file must be LICENSE or under licenses/`);
    }
    if (validateAssets) {
      const licenseFile = resolveRepositoryPath(
        root,
        metrics.provenance.licenseFile,
        "license file path",
      );
      await requireFile(licenseFile, "license file");
    }
  }

  const themeIds = new Set();
  const reservedIds = new Set(catalog.reservedThemeIds);
  const iconSubjects = new Map();
  const assetPaths = new Map();

  for (const theme of catalog.themes) {
    if (themeIds.has(theme.id)) {
      fail(`duplicate theme id: ${theme.id}`);
    }
    if (reservedIds.has(theme.id)) {
      fail(`active theme id is reserved: ${theme.id}`);
    }
    if (!metricIds.has(theme.typography.fontMetricsId)) {
      fail(
        `theme ${theme.id} references unknown font metrics ${theme.typography.fontMetricsId}`,
      );
    }
    themeIds.add(theme.id);

    const icons = new Map();
    for (const icon of theme.icons) {
      if (icons.has(icon.id)) {
        fail(`theme ${theme.id} has duplicate icon id: ${icon.id}`);
      }
      const existingSubject = iconSubjects.get(icon.id);
      if (existingSubject !== undefined && existingSubject !== icon.subject) {
        fail(`icon ${icon.id} has inconsistent subjects across themes`);
      }
      iconSubjects.set(icon.id, icon.subject);
      icons.set(icon.id, icon);

      const assetIdentity = JSON.stringify({ id: icon.id, asset: icon.asset });
      const existingAssetIdentity = assetPaths.get(icon.asset.path);
      if (
        existingAssetIdentity !== undefined &&
        existingAssetIdentity !== assetIdentity
      ) {
        fail(`icon asset path has conflicting metadata: ${icon.asset.path}`);
      }
      assetPaths.set(icon.asset.path, assetIdentity);

      const distribution = icon.asset.provenance.redistribution;
      if (Object.values(distribution).some((permitted) => !permitted)) {
        fail(
          `icon ${theme.id}/${icon.id} is not redistributable in every supported artifact`,
        );
      }
      if (
        icon.asset.provenance.licenseFile !== "LICENSE" &&
        !icon.asset.provenance.licenseFile.startsWith("licenses/")
      ) {
        fail(`icon ${theme.id}/${icon.id} license file must be LICENSE or under licenses/`);
      }

      if (validateAssets) {
        const assetFile = resolveRepositoryPath(root, icon.asset.path, "icon asset path");
        const licenseFile = resolveRepositoryPath(
          root,
          icon.asset.provenance.licenseFile,
          "license file path",
        );
        await requireFile(assetFile, "icon asset");
        await requireFile(licenseFile, "license file");
        if (path.extname(assetFile).toLowerCase() !== ".svg") {
          fail(`icon asset must be an SVG file: ${icon.asset.path}`);
        }
        validateSvgText(
          await readFile(assetFile, "utf8"),
          icon.asset.path,
          icon.asset.viewBox,
        );
      }
    }

    for (const kind of nodeKinds) {
      const fallbackId = theme.nodeKindFallbacks[kind].fallbackIconId;
      if (!icons.has(fallbackId)) {
        fail(`theme ${theme.id} ${kind} fallback references unknown icon ${fallbackId}`);
      }
    }
  }

  for (const requiredThemeId of requiredThemeIds) {
    if (!themeIds.has(requiredThemeId)) {
      fail(`catalog is missing required theme: ${requiredThemeId}`);
    }
  }

  if (!themeIds.has(catalog.fallbacks.missingThemeId)) {
    fail(`catalog fallback references unknown theme ${catalog.fallbacks.missingThemeId}`);
  }
  for (const theme of catalog.themes) {
    if (!theme.icons.some((icon) => icon.id === catalog.fallbacks.missingIconId)) {
      fail(
        `theme ${theme.id} is missing catalog fallback icon ${catalog.fallbacks.missingIconId}`,
      );
    }
  }

  return catalog;
}

export async function validateProviderPack(
  providerPack,
  { root = repositoryRoot, validateAssets = true } = {},
) {
  const schema = await readJson(
    path.join(repositoryRoot, "schemas/provider-pack.schema.json"),
  );
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);
  if (!validate(providerPack)) {
    const details = validate.errors
      .map((error) => `${error.instancePath || "/"} ${error.message}`)
      .join("; ");
    fail(`provider pack schema validation failed: ${details}`);
  }

  const expectedPrefix = `${providerPack.provider.id}:`;
  const iconIds = new Set();
  const assetPaths = new Set();
  for (const icon of providerPack.icons) {
    if (!icon.id.startsWith(expectedPrefix)) {
      fail(
        `provider icon ${icon.id} must use the ${providerPack.provider.id} namespace`,
      );
    }
    if (iconIds.has(icon.id)) {
      fail(`duplicate provider icon id: ${icon.id}`);
    }
    iconIds.add(icon.id);

    if (!icon.asset.path.startsWith("assets/")) {
      fail(`provider icon asset must be under assets/: ${icon.asset.path}`);
    }
    if (assetPaths.has(icon.asset.path)) {
      fail(`duplicate provider icon asset path: ${icon.asset.path}`);
    }
    assetPaths.add(icon.asset.path);

    const hashesMatch =
      icon.asset.originalSha256 === icon.asset.processedSha256;
    if (icon.asset.transformations.length === 0 && !hashesMatch) {
      fail(`provider icon ${icon.id} changed without a transformation record`);
    }

    if (validateAssets) {
      const assetFile = resolveRepositoryPath(
        root,
        icon.asset.path,
        "provider icon asset path",
      );
      await requireFile(assetFile, "provider icon asset");
      if (path.extname(assetFile).toLowerCase() !== ".svg") {
        fail(`provider icon asset must be an SVG file: ${icon.asset.path}`);
      }
      const assetBytes = await readFile(assetFile);
      const digest = `sha256:${createHash("sha256").update(assetBytes).digest("hex")}`;
      if (digest !== icon.asset.processedSha256) {
        fail(`provider icon ${icon.id} processed hash does not match its asset`);
      }
      validateSvgText(
        assetBytes.toString("utf8"),
        icon.asset.path,
        icon.asset.viewBox,
      );
    }
  }

  return providerPack;
}

export async function catalogRevision(catalog, root = repositoryRoot) {
  const hash = createHash("sha256");
  hash.update("stack-theme-catalog-v1\0");
  hash.update(formatJson(catalog));

  const assetPaths = [
    ...new Set(
      catalog.themes.flatMap((theme) =>
        theme.icons.map((icon) => icon.asset.path),
      ),
    ),
  ].sort();
  for (const assetPath of assetPaths) {
    hash.update("asset\0");
    hash.update(assetPath);
    hash.update("\0");
    hash.update(await readFile(resolveRepositoryPath(root, assetPath, "icon asset path")));
  }

  return `sha256:${hash.digest("hex")}`;
}
