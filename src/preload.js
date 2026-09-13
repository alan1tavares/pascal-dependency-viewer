import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('pascalDependencyViewer', {
  openFile: () => ipcRenderer.invoke('openFile'),
  openProject: () => ipcRenderer.invoke('openProject'),
  expandFromRootUnit: (args) => ipcRenderer.invoke('expandFromRootUnit', args),
  onGraphLoaded: (callback) => {
    const listener = (_event, graph) => callback(graph);
    ipcRenderer.on('app:graph-loaded', listener);
    return () => ipcRenderer.removeListener('app:graph-loaded', listener);
  },
  onProjectLoaded: (callback) => {
    const listener = (_event, project) => callback(project);
    ipcRenderer.on('app:project-loaded', listener);
    return () => ipcRenderer.removeListener('app:project-loaded', listener);
  },
});
