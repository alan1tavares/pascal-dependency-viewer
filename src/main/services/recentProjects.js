import { app } from "electron";
import fs from "node:fs";
import path from "node:path";

import {
  addRecentProject,
  removeRecentProject,
} from "../../domain/recentProjects/index.js";

function getFilePath() {
  return path.join(app.getPath("userData"), "recent-projects.json");
}

export function list() {
  try {
    const data = JSON.parse(fs.readFileSync(getFilePath(), "utf-8"));
    const isListOfPaths =
      Array.isArray(data) && data.every((item) => typeof item === "string");
    return isListOfPaths ? data : [];
  } catch {
    return [];
  }
}

function save(paths) {
  try {
    const filePath = getFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(paths), "utf-8");
  } catch {
    // Falha ao persistir não pode impedir a abertura de um Project.
  }
}

export function add(projectPath) {
  save(addRecentProject(list(), projectPath));
}

export function remove(projectPath) {
  save(removeRecentProject(list(), projectPath));
}
