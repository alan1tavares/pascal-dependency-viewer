import { mount } from 'svelte';
import CommandPalette from '../components/CommandPalette.svelte';

let app = null;

function getApp() {
  if (!app) {
    const container = document.getElementById('commandPaletteContainer');
    if (!container) {
      throw new Error('commandPaletteContainer not found in DOM');
    }
    app = mount(CommandPalette, { target: container });
  }
  return app;
}

export function configureCommandPalette(options) {
  getApp().configure(options);
}

export function showCommandPalette() {
  getApp().showCommandPalette();
}

export function showOpenRecent() {
  getApp().showOpenRecent();
}

export function enterRootUnitMode(projectUnits, projectDir, options) {
  getApp().enterRootUnitMode(projectUnits, projectDir, options);
}

export function isCommandPaletteOpen() {
  return app ? app.isPaletteOpen() : false;
}
