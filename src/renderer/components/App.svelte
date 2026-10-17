<script>
  import { onMount } from 'svelte'
  import Welcome from './Welcome.svelte'
  import GraphView from './GraphView.svelte'
  import TabBar from './TabBar.svelte'
  import { projectStore } from '../stores/project.js'
  import {
    tabsStore,
    activate,
    close,
    closeAllGraphTabs,
    openGraph,
    showNextTab,
    showPreviousTab,
    showWelcome,
  } from '../stores/tabs.js'
  import { graphTabId } from '../../domain/tabs/index.js'
  import {
    configureCommandPalette,
    enterRootUnitMode,
    isCommandPaletteOpen,
    showCommandPalette,
    showOpenRecent,
  } from '../services/commandPalette.js'

  const api = window.pascalDependencyViewer
  const isMac = api.platform === 'darwin'

  async function openRootUnit(projectUnit) {
    const id = graphTabId(projectUnit.unitName)
    if ($tabsStore.tabs.some((tab) => tab.id === id)) {
      activate(id)
      return
    }
    const project = $projectStore
    let graph
    try {
      graph = await api.expandFromRootUnit({
        projectDir: project.projectDir,
        projectUnit: { path: projectUnit.path, unitName: projectUnit.unitName },
        projectUnits: project.projectUnits.map(({ path, unitName }) => ({ path, unitName })),
      })
    } catch (error) {
      window.alert(`Não foi possível gerar o grafo de ${projectUnit.unitName}: ${error.message}`)
      return
    }
    // Outro Project pode ter sido carregado enquanto o grafo era calculado.
    if ($projectStore !== project) return
    openGraph({ unitName: projectUnit.unitName, path: projectUnit.path, graph })
  }

  function handleKeydown(event) {
    if (isCommandPaletteOpen()) return
    const closeModifier = isMac ? event.metaKey : event.ctrlKey
    if (closeModifier && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'w') {
      event.preventDefault()
      close($tabsStore.activeId)
    } else if (event.ctrlKey && !event.metaKey && !event.altKey && event.key === 'Tab') {
      event.preventDefault()
      if (event.shiftKey) showPreviousTab()
      else showNextTab()
    }
  }

  onMount(() => {
    configureCommandPalette({
      hasProject: () => $projectStore !== null,
      getProject: () => $projectStore,
      onRootUnitSelected: openRootUnit,
    })

    api.onProjectLoaded((project) => {
      projectStore.set(project)
      closeAllGraphTabs()
      enterRootUnitMode(project.projectUnits, project.projectDir, { entry: 'direct' })
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
      })
    })

    api.onShowWelcome(() => {
      showWelcome()
    })

    window.addEventListener('keydown', handleKeydown, true)
    return () => window.removeEventListener('keydown', handleKeydown, true)
  })
</script>

<div class="app-container">
  <TabBar tabsState={$tabsStore} onActivate={activate} onClose={close} />
  <div class="tab-content">
    {#each $tabsStore.tabs as tab (tab.id)}
      {@const active = tab.id === $tabsStore.activeId}
      <div class="tab-panel {active ? 'active' : ''}" inert={!active} aria-hidden={!active}>
        {#if tab.kind === 'welcome'}
          <Welcome />
        {:else}
          <GraphView graph={tab.graph} />
        {/if}
      </div>
    {/each}
  </div>
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

  .tab-content {
    flex: 1;
    min-height: 0;
    position: relative;
  }

  /* As Tabs inativas continuam montadas (e com tamanho real, para o canvas da
     vis-network não perder o enquadramento); só deixam de ser vistas. */
  .tab-panel {
    position: absolute;
    inset: 0;
    visibility: hidden;
    pointer-events: none;
  }

  .tab-panel.active {
    visibility: visible;
    pointer-events: auto;
  }
</style>
