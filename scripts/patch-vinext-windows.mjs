import fs from "node:fs";

const file = "node_modules/vinext/dist/server/static-file-cache.js";

if (process.platform === "win32" && fs.existsSync(file)) {
  const source = fs.readFileSync(file, "utf8");
  const before = "relativePath: path.relative(base, batch[j]),";
  const after = 'relativePath: path.relative(base, batch[j]).split(path.sep).join("/"),';

  if (source.includes(before)) {
    fs.writeFileSync(file, source.replace(before, after));
  }
}
