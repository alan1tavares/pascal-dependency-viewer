import { renderRootUnitSelection } from './components/rootUnitSelection.js';

const api = window.pascalDependencyViewer;

api.onProjectLoaded(({ projectUnits, projectDir }) => renderRootUnitSelection(projectUnits, projectDir));
