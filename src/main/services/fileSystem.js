import fs from "node:fs";

export function readFile(filePath) {
  return fs.readFileSync(filePath, "utf-8");
}
