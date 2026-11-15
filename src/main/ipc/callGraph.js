// Canais IPC do Caller Graph (design D8): Methods de uma Project Unit e o
// Caller Graph de um Target Method, ambos sobre o índice em cache
// (`services/callIndexCache.js`). Erros chegam ao renderer com o código no
// início da mensagem: `[NO_PROJECT]`, `[PROJECT_REPLACED]`,
// `[METHOD_NOT_FOUND]`.

import expandCallerGraph from "../../domain/expandCallerGraph/index.js";
import { callIndexCache, CallIndexError } from "../services/callIndexCache.js";

export function listMethods(index, unitName) {
  const unit = index.units.find((u) => u.unitName.toLowerCase() === String(unitName).toLowerCase());
  if (!unit) return { methods: [] };
  if (unit.skipped) return { methods: [], skipped: unit.skipped };
  return { methods: unit.methods.map(({ id, label }) => ({ id, label })) };
}

export function expandGraph(index, methodId) {
  try {
    return expandCallerGraph(index, methodId);
  } catch (error) {
    if (error && error.code === "METHOD_NOT_FOUND") {
      throw new CallIndexError("METHOD_NOT_FOUND", `Method não encontrado: ${methodId}`);
    }
    throw error;
  }
}

export function registerCallGraphHandler(ipcMain, { cache = callIndexCache } = {}) {
  ipcMain.handle("methods:list", async (_event, unitName) => listMethods(await cache.getIndex(), unitName));
  ipcMain.handle("callerGraph:expand", async (_event, methodId) => expandGraph(await cache.getIndex(), methodId));
}
