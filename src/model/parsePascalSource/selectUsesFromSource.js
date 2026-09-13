const USES_CLAUSE_SCOPE = require('./usesClauseScope');

const USES_CLAUSE_REGEX = /uses\s*(\w*\.\w*|\w*|\s|\,)*;/i;

function selectUsesFromSource(source, scope = USES_CLAUSE_SCOPE.INTERFACE) {
   const { interfaceSection, implementationSection } = splitIntoSections(source);
   const interfaceUses = extractUsesFromSection(interfaceSection);

   if (scope === USES_CLAUSE_SCOPE.INTERFACE) {
      return interfaceUses;
   }

   const implementationUses = extractUsesFromSection(implementationSection);
   return mergeUnitLists(interfaceUses, implementationUses);
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

   return match[0]
      .replace(/(uses|;|\s)/gi, '')
      .split(',');
}

function mergeUnitLists(firstList, secondList) {
   const seen = new Set(firstList.map(unitName => unitName.toLowerCase()));
   const merged = [...firstList];

   secondList.forEach(unitName => {
      if (seen.has(unitName.toLowerCase())) {
         return;
      }
      seen.add(unitName.toLowerCase());
      merged.push(unitName);
   });

   return merged;
}

module.exports = selectUsesFromSource;
