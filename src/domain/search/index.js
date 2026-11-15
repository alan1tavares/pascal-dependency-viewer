// Busca usada pelas listas da Command Palette: substring sem diferenciar
// maiúsculas de minúsculas nem acentos.

export function normalizeForSearch(text) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function matchesSearch(text, query) {
  return normalizeForSearch(text).includes(normalizeForSearch(query));
}
