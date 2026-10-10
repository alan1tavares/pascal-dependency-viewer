import { mount } from 'svelte';
import Welcome from './components/Welcome.svelte';
import {
  configureCommandPalette,
  enterRootUnitMode,
  showCommandPalette,
  showOpenRecent,
} from './components/commandPalette.js';

const api = window.pascalDependencyViewer;

// Montar componente Svelte de boas-vindas (Svelte 5 API)
mount(Welcome, {
  target: document.getElementById('svelte-app'),
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
