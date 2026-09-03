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
  "ellipse",
  "g",
  "line",
  "path",
  "polygon",
  "polyline",
  "rect",
  "svg",
  "title",
]);

const allowedAttributes = new Set([
  "aria-hidden",
  "clip-rule",
  "cx",
  "cy",
  "d",
  "fill",
  "fill-rule",
  "height",
  "opacity",
  "points",
  "r",
  "role",
  "rx",
  "ry",
  "stroke",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-width",
  "transform",
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

function validateAttribute(element, name, value, assetPath) {
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
    for (const [name, value] of Object.entries(tag.attributes)) {
      validateAttribute(tag.name, name, value, assetPath);
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
  { root = repositoryRoot, validateAssets = true } = {},
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
  const assetPaths = new Set();

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

      if (assetPaths.has(icon.asset.path)) {
        fail(`icon asset path is used more than once: ${icon.asset.path}`);
      }
      assetPaths.add(icon.asset.path);

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

  return catalog;
}

export async function catalogRevision(catalog, root = repositoryRoot) {
  const hash = createHash("sha256");
  hash.update("stack-theme-catalog-v1\0");
  hash.update(formatJson(catalog));

  const assetPaths = catalog.themes
    .flatMap((theme) => theme.icons.map((icon) => icon.asset.path))
    .sort();
  for (const assetPath of assetPaths) {
    hash.update("asset\0");
    hash.update(assetPath);
    hash.update("\0");
    hash.update(await readFile(resolveRepositoryPath(root, assetPath, "icon asset path")));
  }

  return `sha256:${hash.digest("hex")}`;
}
