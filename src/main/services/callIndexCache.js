// Índice de chamadas do Project aberto, em cache no main process
// (ADR 0007, design D7). Montado sob demanda, compartilhado entre pedidos
// concorrentes e descartado quando outro Project é carregado; não observa o
// sistema de arquivos.

import path from "node:path";
import { readFile as readFileFromDisk } from "node:fs/promises";

import { buildCallIndex } from "../../domain/callIndex/buildCallIndex.js";

export class CallIndexError extends Error {
  constructor(code, message) {
    // O Electron não preserva propriedades de erros em `invoke`: o código vai
    // também na mensagem, como prefixo `[CODE]`.
    super(`[${code}] ${message}`);
    this.name = "CallIndexError";
    this.code = code;
  }
}

export function createCallIndexCache({ build = buildCallIndex, readFile = readFileFromDisk } = {}) {
  let project = null;
  let generation = 0;
  let pending = null;
  let index = null;

  function setProject(next) {
    project = next;
    generation++;
    pending = null;
    index = null;
  }

  function getIndex() {
    if (!project) {
      return Promise.reject(new CallIndexError("NO_PROJECT", "Nenhum Project carregado"));
    }
    if (index) return Promise.resolve(index);
    if (pending) return pending;

    const started = generation;
    const replaced = () =>
      new CallIndexError("PROJECT_REPLACED", "Outro Project foi carregado durante a análise");
    const { dprPath, projectDir, projectUnits } = project;
    const promise = build({
      dprPath,
      projectUnits,
      readFile: (file) => readFile(path.resolve(projectDir, file), "utf-8"),
    }).then(
      (result) => {
        if (started !== generation) throw replaced();
        index = result;
        pending = null;
        return result;
      },
      (error) => {
        if (started !== generation) throw replaced();
        pending = null;
        throw error;
      },
    );
    pending = promise;
    return promise;
  }

  return { setProject, getIndex };
}

export const callIndexCache = createCallIndexCache();
