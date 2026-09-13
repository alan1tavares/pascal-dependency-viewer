import { dialog } from "electron";

import {
  getUnitName,
  selectUsesFromSource,
} from "../../domain/parsePascalSource/index.js";
import mountDependenceGraphStructure from "../../domain/mountDependenceGraphStructure/index.js";
import { readFile } from "../services/fileSystem.js";

export async function performOpenFile() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Custom File Type", extensions: ["pas"] }],
  });
  const filePath = filePaths[0];
  if (!filePath) return null;

  const source = readFile(filePath);
  const unitName = getUnitName(source);
  const listUses = selectUsesFromSource(source);
  return mountDependenceGraphStructure(unitName, listUses);
}

export function registerFileHandler(ipcMain) {
  ipcMain.handle("openFile", () => performOpenFile());
}
