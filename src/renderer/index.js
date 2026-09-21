import { renderRootUnitSelection } from './components/rootUnitSelection.js';
import { showOpenRecentDialog } from './components/openRecentDialog.js';

const api = window.pascalDependencyViewer;

let lastProject = null;

api.onProjectLoaded((project) => {
  lastProject = project;
  renderRootUnitSelection(project.projectUnits, project.projectDir);
});

api.onShowOpenRecent(() => {
  showOpenRecentDialog();
});

api.onShowRootUnitSelection(() => {
  if (!lastProject) return;
  renderRootUnitSelection(lastProject.projectUnits, lastProject.projectDir);
});
