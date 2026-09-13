const { selectUsesFromSource } = require('../parsePascalSource');
const classifyExternalUnits = require('../classifyExternalUnits');

function expandDependencyGraph(rootUnitName, projectUnits, readFile, scope) {
   const nodes = new Map();
   const edges = [];

   nodes.set(rootUnitName.toLowerCase(), mountJsonNode(rootUnitName, 'projectUnit'));
   const queue = [{ unitName: rootUnitName, path: findProjectUnitPath(rootUnitName, projectUnits) }];

   while (queue.length > 0) {
      const { unitName, path } = queue.shift();
      const source = readFile(path);
      const dependencyNames = selectUsesFromSource(source, scope);
      const classifiedDependencies = classifyExternalUnits(dependencyNames, projectUnits);

      classifiedDependencies.forEach(({ unitName: dependencyName, isExternal }) => {
         edges.push({ from: unitName.toLowerCase(), to: dependencyName.toLowerCase() });

         if (nodes.has(dependencyName.toLowerCase())) {
            return;
         }

         if (isExternal) {
            nodes.set(dependencyName.toLowerCase(), mountJsonNode(dependencyName, 'externalUnit'));
            return;
         }

         nodes.set(dependencyName.toLowerCase(), mountJsonNode(dependencyName, 'projectUnit'));
         queue.push({ unitName: dependencyName, path: findProjectUnitPath(dependencyName, projectUnits) });
      });
   }

   return { nodes: Array.from(nodes.values()), edges };
}

function findProjectUnitPath(unitName, projectUnits) {
   const projectUnit = projectUnits.find(
      candidate => candidate.unitName.toLowerCase() === unitName.toLowerCase()
   );
   return projectUnit.path;
}

function mountJsonNode(label, group) {
   return { id: label.toLowerCase(), label, group };
}

module.exports = expandDependencyGraph;
