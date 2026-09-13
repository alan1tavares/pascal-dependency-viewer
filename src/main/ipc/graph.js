import path from "node:path";

import { getUnitName } from "../../domain/parsePascalSource/index.js";
import expandDependencyGraph from "../../domain/expandDependencyGraph/index.js";
import { readFile as readFileFromDisk } from "../services/fileSystem.js";

function performExpandFromRootUnit({
  projectDir,
  projectUnit,
  projectUnits,
  scope,
}) {
  const filePath = path.resolve(projectDir, projectUnit.path);
  const source = readFileFromDisk(filePath);
  const unitName = getUnitName(source);
  const readFile = (relativePath) =>
    readFileFromDisk(path.resolve(projectDir, relativePath));
  return expandDependencyGraph(unitName, projectUnits, readFile, scope);
}

export function registerGraphHandler(ipcMain) {
  ipcMain.handle("expandFromRootUnit", (_event, args) =>
    performExpandFromRootUnit(args),
  );
}
