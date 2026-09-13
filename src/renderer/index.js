import { renderGraph } from './components/graphView.js';
import { renderRootUnitSelection } from './components/rootUnitSelection.js';

const api = window.pascalDependencyViewer;

api.onGraphLoaded((graph) => renderGraph(graph.nodes, graph.edges));
api.onProjectLoaded(({ projectUnits, projectDir }) => renderRootUnitSelection(projectUnits, projectDir));
