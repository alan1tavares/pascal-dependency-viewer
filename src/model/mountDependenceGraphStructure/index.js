function mountDependenceGraphStructure(nameUnitMain, unitDependenceArray) {

   const nodes = mountNodes(nameUnitMain, unitDependenceArray);
   const edges = mountEdges(nameUnitMain, unitDependenceArray);
   return {nodes, edges};
}

function mountNodes(nameUnitMain, unitDependenceArray) {
   const nodeMain = [mountJsonNode(nameUnitMain)];
   const nodesDependence = unitDependenceArray.map(value => mountJsonNode(value));
   return nodeMain.concat(nodesDependence); 
}

function mountEdges(nameUnitMain, unitDependenceArray) {
   return unitDependenceArray.map(value => {
      return {from: nameUnitMain.toLowerCase(), to: value.toLowerCase()}
   });
}

function mountJsonNode(label) {
   return {id: label.toLowerCase(), label};
}

module.exports = mountDependenceGraphStructure;