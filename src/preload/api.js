import { ipcRenderer } from 'electron';

export const api = {
  platform: process.platform,
  openProject: () => ipcRenderer.invoke('openProject'),
  expandFromRootUnit: (args) => ipcRenderer.invoke('expandFromRootUnit', args),
  listRecentProjects: () => ipcRenderer.invoke('recentProjects:list'),
  openRecentProject: (filePath) => ipcRenderer.invoke('recentProjects:open', filePath),
  runCommand: (id) => ipcRenderer.invoke('commands:run', id),
  onShowCommandPalette: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('app:show-command-palette', listener);
    return () => ipcRenderer.removeListener('app:show-command-palette', listener);
  },
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
