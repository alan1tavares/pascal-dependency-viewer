import { dialog } from "electron";
import path from "node:path";

import parseDprSource from "../../domain/parseDprSource/index.js";
import { readFile } from "../services/fileSystem.js";
import * as recentProjects from "../services/recentProjects.js";

export function loadProject(filePath) {
  const source = readFile(filePath);
  const projectUnits = parseDprSource(source);
  const projectDir = path.dirname(filePath);
  recentProjects.add(filePath);
  return { projectUnits, projectDir };
}

export async function performOpenProject() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Delphi Project", extensions: ["dpr"] }],
  });
  const filePath = filePaths[0];
  if (!filePath) return null;

  return loadProject(filePath);
}

async function performOpenRecentProject(filePath) {
  try {
    return loadProject(filePath);
  } catch (error) {
    // Erros de leitura de disco carregam `code` (ENOENT, EACCES...); falhas de
    // parse não, e continuam propagando.
    if (typeof error?.code !== "string") throw error;
    recentProjects.remove(filePath);
    await dialog.showMessageBox({
      type: "error",
      message: `Arquivo não encontrado: ${filePath}`,
    });
    return null;
  }
}

export function registerProjectHandler(ipcMain) {
  ipcMain.handle("openProject", () => performOpenProject());
  ipcMain.handle("recentProjects:list", () => recentProjects.list());
  ipcMain.handle("recentProjects:open", async (event, filePath) => {
    const project = await performOpenRecentProject(filePath);
    if (project) event.sender.send("app:project-loaded", project);
  });
}
