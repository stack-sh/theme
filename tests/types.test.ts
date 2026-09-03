import {
  catalog,
  catalogRevision,
  catalogVersion,
  iconAssets,
  iconSvg,
  type Catalog,
  type Theme,
} from "@stack-sh/theme";

const typedCatalog: Readonly<Catalog> = catalog;
const themes: readonly Theme[] = typedCatalog.themes;
const version: string = catalogVersion;
const revision: `sha256:${string}` = catalogRevision;
const assets: Readonly<Record<string, string>> = iconAssets;
const missingAsset: string | undefined = iconSvg("assets/missing.svg");

void themes;
void version;
void revision;
void assets;
void missingAsset;
