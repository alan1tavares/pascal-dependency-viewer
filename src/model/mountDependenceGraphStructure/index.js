function mountDependenceGraphStructure(nameUnitMain, array) {
   const nodes = mountNodes(nameUnitMain, array);
   const edges = mountEdges(nameUnitMain, array);
   return {nodes, edges};
}

function mountNodes(nameUnitMain, array) {
   const nodeMain = [mountJsonNode(nameUnitMain)];
   const nodesDependence = array.map(value => mountJsonNode(value));
   return nodeMain.concat(nodesDependence); 
}

function mountEdges(nameUnitMain, array) {
   return array.map(value => {
      return {from: nameUnitMain, to: value}
   });
}

function mountJsonNode(label) {
   return {id: label, label};
}



module.exports = mountDependenceGraphStructure;