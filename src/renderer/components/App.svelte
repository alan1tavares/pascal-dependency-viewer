<script>
  import { onMount } from 'svelte'
  import Welcome from './Welcome.svelte'
  import GraphView from './GraphView.svelte'
  import { projectStore } from '../stores/project.js'
  import { graphRenderedStore } from '../stores/graph.js'
  import { viewMode } from '../stores/ui.js'
  import {
    configureCommandPalette,
    enterRootUnitMode,
    showCommandPalette,
    showOpenRecent,
  } from '../services/commandPalette.js'

  const api = window.pascalDependencyViewer

  let graphViewComponent = $state(undefined)

  function updateCommandPalette() {
    configureCommandPalette({
      hasProject: () => $projectStore !== null,
      getProject: () => $projectStore,
      onRootUnitSelected: () => {
        graphRenderedStore.set(true)
      },
      graphViewComponent,
    })
  }

  // Re-configure CommandPalette whenever GraphView component becomes available
  $effect(() => {
    if (graphViewComponent) {
      updateCommandPalette()
    }
  })

  onMount(() => {
    api.onProjectLoaded((project) => {
      projectStore.set(project)
      viewMode.set('graph')
      enterRootUnitMode(project.projectUnits, project.projectDir, {
        entry: 'direct',
        closable: false,
      })
    })

    api.onShowCommandPalette(() => {
      showCommandPalette()
    })

    api.onShowOpenRecent(() => {
      showOpenRecent()
    })

    api.onShowRootUnitSelection(() => {
      if (!$projectStore) return
      enterRootUnitMode($projectStore.projectUnits, $projectStore.projectDir, {
        entry: 'direct',
        closable: $graphRenderedStore,
      })
    })
  })
</script>

<div class="app-container">
  {#if $viewMode === 'welcome'}
    <Welcome />
  {:else if $viewMode === 'graph'}
    <GraphView bind:this={graphViewComponent} />
  {/if}
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    position: relative;
  }
</style>
