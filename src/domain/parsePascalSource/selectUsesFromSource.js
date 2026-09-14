import { USES_CLAUSE_ORIGIN } from './usesClauseOrigin.js';

const USES_CLAUSE_REGEX = /uses\s*(\w*\.\w*|\w*|\s|\,)*;/i;

function selectUsesFromSource(source) {
   const { interfaceSection, implementationSection } = splitIntoSections(source);
   const interfaceUses = extractUsesFromSection(interfaceSection);
   const implementationUses = extractUsesFromSection(implementationSection);

   return mergeWithOrigin(interfaceUses, implementationUses);
}

function splitIntoSections(source) {
   const interfaceMatch = /\binterface\b/i.exec(source);
   const implementationMatch = /\bimplementation\b/i.exec(source);

   const interfaceStart = interfaceMatch ? interfaceMatch.index + interfaceMatch[0].length : source.length;
   const implementationStart = implementationMatch ? implementationMatch.index : source.length;

   const interfaceSection = source.slice(interfaceStart, implementationStart);
   const implementationSection = implementationMatch
      ? source.slice(implementationMatch.index + implementationMatch[0].length)
      : '';

   return { interfaceSection, implementationSection };
}

function extractUsesFromSection(sectionSource) {
   const match = sectionSource.match(USES_CLAUSE_REGEX);

   if (!match) {
      return [];
   }

   return dedupeUnitNames(
      match[0]
         .replace(/(uses|;|\s)/gi, '')
         .split(',')
   );
}

function dedupeUnitNames(unitNames) {
   const seen = new Set();
   return unitNames.filter(unitName => {
      const key = unitName.toLowerCase();
      if (seen.has(key)) {
         return false;
      }
      seen.add(key);
      return true;
   });
}

function mergeWithOrigin(interfaceUses, implementationUses) {
   const implementationKeys = new Set(implementationUses.map(unitName => unitName.toLowerCase()));
   const seen = new Set();
   const result = [];

   interfaceUses.forEach(unitName => {
      const key = unitName.toLowerCase();
      seen.add(key);
      result.push({
         unitName,
         origin: implementationKeys.has(key) ? USES_CLAUSE_ORIGIN.BOTH : USES_CLAUSE_ORIGIN.INTERFACE,
      });
   });

   implementationUses.forEach(unitName => {
      const key = unitName.toLowerCase();
      if (seen.has(key)) {
         return;
      }
      seen.add(key);
      result.push({ unitName, origin: USES_CLAUSE_ORIGIN.IMPLEMENTATION });
   });

   return result;
}

export default selectUsesFromSource;
