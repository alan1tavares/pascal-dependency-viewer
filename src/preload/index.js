import { contextBridge } from 'electron';

import { api } from './api.js';

contextBridge.exposeInMainWorld('pascalDependencyViewer', api);
