import { writable } from 'svelte/store'

export const viewMode = writable('welcome')

export function setViewMode(mode) {
  if (mode === 'welcome' || mode === 'graph') {
    viewMode.set(mode)
  }
}
