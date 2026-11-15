import { matchesSearch } from '../search/index.js';

// Filtra os Methods de uma Unit (como chegam do main, com `label`) pelo texto
// digitado no modo `Selecionar Método`, preservando a ordem do fonte.
export function filterMethods(methods, text) {
  return methods.filter((method) => matchesSearch(method.label, text));
}
