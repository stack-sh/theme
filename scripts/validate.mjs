import path from "node:path";

import { readJson, repositoryRoot, validateCatalog } from "./catalog-lib.mjs";

const catalogPaths = [
  "catalog/catalog.json",
  "tests/fixtures/catalog/valid.json",
];

for (const relativePath of catalogPaths) {
  const catalog = await readJson(path.join(repositoryRoot, relativePath));
  await validateCatalog(catalog);
  console.log(`validated ${relativePath}`);
}
