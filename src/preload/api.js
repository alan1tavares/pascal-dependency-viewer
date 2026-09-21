import { ipcRenderer } from 'electron';

export const api = {
  openProject: () => ipcRenderer.invoke('openProject'),
  expandFromRootUnit: (args) => ipcRenderer.invoke('expandFromRootUnit', args),
  listRecentProjects: () => ipcRenderer.invoke('recentProjects:list'),
  openRecentProject: (filePath) => ipcRenderer.invoke('recentProjects:open', filePath),
  onShowOpenRecent: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('app:show-open-recent', listener);
    return () => ipcRenderer.removeListener('app:show-open-recent', listener);
  },
  onProjectLoaded: (callback) => {
    const listener = (_event, project) => callback(project);
    ipcRenderer.on('app:project-loaded', listener);
    return () => ipcRenderer.removeListener('app:project-loaded', listener);
  },
  onShowRootUnitSelection: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('app:show-root-unit-selection', listener);
    return () => ipcRenderer.removeListener('app:show-root-unit-selection', listener);
  },
};
