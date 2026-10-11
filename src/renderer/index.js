import { mount } from 'svelte';
import Welcome from './components/Welcome.svelte';
import GraphView from './components/GraphView.svelte';
import {
  configureCommandPalette,
  enterRootUnitMode,
  showCommandPalette,
  showOpenRecent,
} from './services/commandPalette.js';

const api = window.pascalDependencyViewer;

mount(Welcome, {
  target: document.getElementById('svelte-app'),
});

const graphViewComponent = mount(GraphView, {
  target: document.getElementById('mynetwork'),
});

let lastProject = null;
let hasRenderedGraphForCurrentProject = false;

function onRootUnitSelected() {
  hasRenderedGraphForCurrentProject = true;
}

configureCommandPalette({
  hasProject: () => lastProject !== null,
  getProject: () => lastProject,
  onRootUnitSelected,
  graphViewComponent,
});

api.onProjectLoaded((project) => {
  lastProject = project;
  hasRenderedGraphForCurrentProject = false;
  enterRootUnitMode(project.projectUnits, project.projectDir, {
    entry: 'direct',
    closable: false,
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
  enterRootUnitMode(lastProject.projectUnits, lastProject.projectDir, {
    entry: 'direct',
    closable: hasRenderedGraphForCurrentProject,
  });
});
