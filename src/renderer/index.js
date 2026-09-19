import { renderRootUnitSelection } from './components/rootUnitSelection.js';

const api = window.pascalDependencyViewer;

let lastProject = null;

api.onProjectLoaded((project) => {
  lastProject = project;
  renderRootUnitSelection(project.projectUnits, project.projectDir);
});

api.onShowRootUnitSelection(() => {
  if (!lastProject) return;
  renderRootUnitSelection(lastProject.projectUnits, lastProject.projectDir);
});
