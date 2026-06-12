import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const roots = ["src", "tests"];
const files = [];

for (const root of roots) {
  for (const name of await readdir(root)) {
    if (name.endsWith(".js") || name.endsWith(".mjs")) {
      files.push(join(root, name));
    }
  }
}

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
