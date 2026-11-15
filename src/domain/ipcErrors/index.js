// O main identifica seus erros com um código entre colchetes no início da
// mensagem (`[PROJECT_REPLACED] ...`), porque o Electron não preserva
// propriedades customizadas de erros em `invoke`. O próprio Electron prefixa
// a mensagem (`Error invoking remote method 'x': Error: [CODE] ...`), então o
// código é procurado em qualquer posição.
export function ipcErrorCode(error) {
  const message = (error && error.message) || String(error ?? '');
  const match = /\[([A-Z][A-Z0-9_]*)\]/.exec(message);
  return match ? match[1] : null;
}
