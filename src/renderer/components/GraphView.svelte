<script>
  import { onMount, onDestroy } from 'svelte';
  import NetworkRenderer from '../services/networkRenderer.js';

  let containerEl = $state();
  let filterPanelEl = $state();
  let networkRenderer = $state(null);

  let interfaceVisible = $state(true);
  let implementationVisible = $state(true);
  let externalVisible = $state(false);

  function handleCheckboxChange(e) {
    if (!interfaceVisible && !implementationVisible) {
      e.target.checked = true;
      interfaceVisible = interfaceVisible || !implementationVisible;
      implementationVisible = implementationVisible || !interfaceVisible;
    }
    applyViewFilter();
  }

  onMount(() => {
    networkRenderer = new NetworkRenderer(containerEl);
    networkRenderer.initialize();
  });

  onDestroy(() => {
    if (networkRenderer) {
      networkRenderer.destroy();
    }
  });

  $effect(() => {
    interfaceVisible;
    implementationVisible;
    externalVisible;
    applyViewFilter();
  });

  export function renderGraph(nodes, edges, rootUnit) {
    if (!networkRenderer) return;
    networkRenderer.renderGraph(nodes, edges, rootUnit);

    // Aplicar filtros após renderizar
    applyViewFilter();

    if (containerEl) {
      containerEl.style.display = 'block';
    }
    if (filterPanelEl) {
      filterPanelEl.style.display = 'block';
    }
  }

  function applyViewFilter() {
    if (!networkRenderer) return;
    networkRenderer.applyFilter({
      interfaceVisible,
      implementationVisible,
      externalVisible,
    });
  }
</script>

<div class="graph-container">
  <div bind:this={containerEl} class="network-container"></div>

  <div bind:this={filterPanelEl} class="filter-panel">
    <label>
      <input
        type="checkbox"
        id="viewFilterInterface"
        bind:checked={interfaceVisible}
        onchange={handleCheckboxChange}
      />
      Interface
    </label>
    <label>
      <input
        type="checkbox"
        id="viewFilterImplementation"
        bind:checked={implementationVisible}
        onchange={handleCheckboxChange}
      />
      Implementation
    </label>
    <label>
      <input
        type="checkbox"
        id="viewFilterExternal"
        bind:checked={externalVisible}
        onchange={handleCheckboxChange}
      />
      External
    </label>
  </div>
</div>

<style>
  .graph-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .network-container {
    flex: 1;
    display: none;
    width: 100%;
    height: 100%;
  }

  .filter-panel {
    display: none;
    position: fixed;
    top: 16px;
    right: 16px;
    background: white;
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    z-index: 10;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    font-family: sans-serif;
    font-size: 14px;
  }

  .filter-panel label {
    display: block;
    margin-bottom: 8px;
    cursor: pointer;
    user-select: none;
  }

  .filter-panel input[type='checkbox'] {
    margin-right: 8px;
  }
</style>
