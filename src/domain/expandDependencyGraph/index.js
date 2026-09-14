import { selectUsesFromSource } from '../parsePascalSource/index.js';
import classifyExternalUnits from '../classifyExternalUnits/index.js';

function expandDependencyGraph(rootUnitName, projectUnits, readFile) {
   const nodes = new Map();
   const edges = [];

   const rootUnitId = rootUnitName.toLowerCase();
   nodes.set(rootUnitId, mountJsonNode(rootUnitName, 'projectUnit'));
   const queue = [{ unitName: rootUnitName, path: findProjectUnitPath(rootUnitName, projectUnits) }];

   while (queue.length > 0) {
      const { unitName, path } = queue.shift();
      const source = readFile(path);
      const usesEntries = selectUsesFromSource(source);
      const classifiedDependencies = classifyExternalUnits(
         usesEntries.map(entry => entry.unitName),
         projectUnits
      );

      classifiedDependencies.forEach(({ unitName: dependencyName, isExternal }, index) => {
         const { origin } = usesEntries[index];
         edges.push({ from: unitName.toLowerCase(), to: dependencyName.toLowerCase(), origin });

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

   return { nodes: Array.from(nodes.values()), edges, rootUnitId };
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

export default expandDependencyGraph;
