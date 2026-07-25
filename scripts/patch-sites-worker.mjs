import { cp, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";

const entryPath = new URL("../dist/server/index.js", import.meta.url);
const source = await readFile(entryPath, "utf8");
const exportPattern = /export \{ ([A-Za-z0-9_$]+) as default, generateStaticParamsMap \};\s*$/;
const match = source.match(exportPattern);

if (!match) {
  throw new Error("Unable to locate the vinext server default export.");
}

const handlerName = match[1];
const patched = source.replace(
  exportPattern,
  `const __spectrumWorker = { fetch: ${handlerName} };\nexport { __spectrumWorker as default, generateStaticParamsMap };\n`,
);

await writeFile(entryPath, patched, "utf8");

const metadataDirectory = new URL("../dist/.openai/", import.meta.url);
await mkdir(metadataDirectory, { recursive: true });
await copyFile(
  new URL("../.openai/hosting.json", import.meta.url),
  new URL("hosting.json", metadataDirectory),
);
await cp(
  new URL("../drizzle/", import.meta.url),
  new URL("drizzle/", metadataDirectory),
  { recursive: true, force: true },
);
