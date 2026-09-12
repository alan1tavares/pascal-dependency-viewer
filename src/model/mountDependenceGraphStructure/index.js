const classifyExternalUnits = require('../classifyExternalUnits');

function mountDependenceGraphStructure(nameUnitMain, unitDependenceArray, projectUnits) {

   const nodes = mountNodes(nameUnitMain, unitDependenceArray, projectUnits);
   const edges = mountEdges(nameUnitMain, unitDependenceArray);
   return {nodes, edges};
}

function mountNodes(nameUnitMain, unitDependenceArray, projectUnits) {
   if (!projectUnits) {
      const nodeMain = [mountJsonNode(nameUnitMain)];
      const nodesDependence = unitDependenceArray.map(value => mountJsonNode(value));
      return nodeMain.concat(nodesDependence);
   }

   const nodeMain = [mountJsonNode(nameUnitMain, 'projectUnit')];
   const classifiedDependencies = classifyExternalUnits(unitDependenceArray, projectUnits);
   const nodesDependence = classifiedDependencies.map(({ unitName, isExternal }) =>
      mountJsonNode(unitName, isExternal ? 'externalUnit' : 'projectUnit')
   );
   return nodeMain.concat(nodesDependence);
}

function mountEdges(nameUnitMain, unitDependenceArray) {
   return unitDependenceArray.map(value => {
      return {from: nameUnitMain.toLowerCase(), to: value.toLowerCase()}
   });
}

function mountJsonNode(label, group) {
   return group ? {id: label.toLowerCase(), label, group} : {id: label.toLowerCase(), label};
}

module.exports = mountDependenceGraphStructure;