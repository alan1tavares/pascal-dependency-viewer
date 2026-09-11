function parseDprSource(source) {
   const usesClauseRegex = /uses[\s\S]*?;/i;
   const usesClause = source.match(usesClauseRegex)[0];

   const projectUnitRegex = /([\w.]+)\s+in\s+'([^']+)'(?:\s*\{[^}]*\})?/g;
   const projectUnits = [];
   let match;

   while ((match = projectUnitRegex.exec(usesClause)) !== null) {
      projectUnits.push({ unitName: match[1], path: match[2] });
   }

   return projectUnits;
}

module.exports = parseDprSource;
