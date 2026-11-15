// jsdom não implementa CSS.escape (usado pela TabBar).
globalThis.CSS ??= {};
CSS.escape ??= (value) => String(value).replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`);
