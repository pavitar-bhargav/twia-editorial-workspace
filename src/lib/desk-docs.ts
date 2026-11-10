import { cacheLife } from "next/cache";
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function readDeskDocs() {
  "use cache";
  cacheLife("max");
  const root = process.cwd();
  const [productNote, sampleEditorial] = await Promise.all([
    readFile(path.join(root, "PRODUCT_NOTE.md"), "utf8"),
    readFile(path.join(root, "SAMPLE_EDITORIAL.md"), "utf8"),
  ]);
  return { productNote, sampleEditorial };
}
