import { ipcRenderer } from 'electron';

export const api = {
  openProject: () => ipcRenderer.invoke('openProject'),
  expandFromRootUnit: (args) => ipcRenderer.invoke('expandFromRootUnit', args),
  onProjectLoaded: (callback) => {
    const listener = (_event, project) => callback(project);
    ipcRenderer.on('app:project-loaded', listener);
    return () => ipcRenderer.removeListener('app:project-loaded', listener);
  },
};
