import './components/CommandPalette.js';
import { renderGraph } from './components/graphView.js';

const api = window.pascalDependencyViewer;

let lastProject = null;
let hasRenderedGraphForCurrentProject = false;

const palette = document.querySelector('command-palette');

function onRootUnitSelected() {
  hasRenderedGraphForCurrentProject = true;
}

palette.setHasProject(() => lastProject !== null);
palette.setGetProject(() => lastProject);
palette.setOnRootUnitSelected(onRootUnitSelected);

palette.addEventListener('selection-confirmed', async (event) => {
  const { item, mode } = event.detail;

  if (mode === 'commands') {
    palette.close();
    api.runCommand(item.id);
  } else if (mode === 'recents') {
    palette.close();
    api.openRecentProject(item);
  } else if (mode === 'rootUnit') {
    const graph = await api.expandFromRootUnit({
      projectDir: lastProject.projectDir,
      projectUnit: item,
      projectUnits: lastProject.projectUnits,
    });
    renderGraph(graph.nodes, graph.edges, graph.rootUnitId);
    onRootUnitSelected();
    palette.close();
    palette.closable = true;
  }
});

palette.addEventListener('closed', () => {
  // Paleta foi fechada
});

api.onProjectLoaded((project) => {
  lastProject = project;
  hasRenderedGraphForCurrentProject = false;
  palette.closable = false;
  palette.setProjectUnits(project.projectUnits, project.projectDir);
  palette.switchMode('rootUnit');
  palette.open();
});

api.onShowCommandPalette(() => {
  palette.open();
});

api.onShowOpenRecent(() => {
  palette.switchMode('recents');
  palette.open();
});

api.onShowRootUnitSelection(() => {
  if (!lastProject) return;
  palette.closable = hasRenderedGraphForCurrentProject;
  palette.setProjectUnits(lastProject.projectUnits, lastProject.projectDir);
  palette.switchMode('rootUnit');
  palette.open();
});
