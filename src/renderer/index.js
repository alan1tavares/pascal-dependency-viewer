import { renderRootUnitSelection } from './components/rootUnitSelection.js';
import {
  closeCommandPalette,
  configureCommandPalette,
  showCommandPalette,
  showOpenRecent,
} from './components/commandPalette.js';

const api = window.pascalDependencyViewer;

let lastProject = null;
let hasRenderedGraphForCurrentProject = false;

function onRootUnitSelected() {
  hasRenderedGraphForCurrentProject = true;
}

configureCommandPalette({ hasProject: () => lastProject !== null });

api.onProjectLoaded((project) => {
  lastProject = project;
  closeCommandPalette();
  hasRenderedGraphForCurrentProject = false;
  renderRootUnitSelection(project.projectUnits, project.projectDir, {
    closable: false,
    onRootUnitSelected,
  });
});

api.onShowCommandPalette(() => {
  showCommandPalette();
});

api.onShowOpenRecent(() => {
  showOpenRecent();
});

api.onShowRootUnitSelection(() => {
  if (!lastProject) return;
  renderRootUnitSelection(lastProject.projectUnits, lastProject.projectDir, {
    closable: hasRenderedGraphForCurrentProject,
    onRootUnitSelected,
  });
});
