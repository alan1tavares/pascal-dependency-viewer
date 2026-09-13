function classifyExternalUnits(dependencyNames, projectUnits) {
   const projectUnitNames = projectUnits.map(projectUnit => projectUnit.unitName.toLowerCase());

   return dependencyNames.map(unitName => ({
      unitName,
      isExternal: !projectUnitNames.includes(unitName.toLowerCase()),
   }));
}

export default classifyExternalUnits;
