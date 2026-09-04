import path from "node:path";

import {
  readJson,
  repositoryRoot,
  validateCatalog,
  validateProviderPack,
} from "./catalog-lib.mjs";

const catalogs = [
  {
    path: "catalog/catalog.json",
    requiredThemeIds: ["default", "light", "dark"],
  },
  { path: "tests/fixtures/catalog/valid.json", requiredThemeIds: [] },
];

for (const entry of catalogs) {
  const catalog = await readJson(path.join(repositoryRoot, entry.path));
  await validateCatalog(catalog, { requiredThemeIds: entry.requiredThemeIds });
  console.log(`validated ${entry.path}`);
}

const providerPackRoot = path.join(repositoryRoot, "tests/fixtures/provider-pack");
for (const fixture of ["valid.json", "multi-source.json"]) {
  await validateProviderPack(await readJson(path.join(providerPackRoot, fixture)), {
    root: providerPackRoot,
  });
  console.log(`validated tests/fixtures/provider-pack/${fixture}`);
}
