<script>
  import { onMount, onDestroy } from 'svelte';
  import CallerGraphRenderer from '../services/callerGraphRenderer.js';

  // `graph`: { nodes, edges, skippedUnits } (spec `caller-graph-expansion`).
  let { graph } = $props();

  let containerEl = $state();
  let renderer = null;

  onMount(() => {
    renderer = new CallerGraphRenderer(containerEl);
    renderer.render(graph);
  });

  onDestroy(() => renderer?.destroy());
</script>

<div class="caller-graph">
  {#if graph.skippedUnits.length > 0}
    <div class="skipped-warning" role="status">
      O grafo pode estar incompleto. Units não analisadas:
      {#each graph.skippedUnits as unit, i (unit.unitName)}
        <span class="skipped-unit" title={unit.reason}>{unit.unitName}</span>{i < graph.skippedUnits.length - 1 ? ', ' : ''}
      {/each}
    </div>
  {/if}
  <div bind:this={containerEl} class="network-container"></div>
</div>

<style>
  .caller-graph {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }

  .skipped-warning {
    flex: 0 0 auto;
    padding: 6px 12px;
    background: #fff4d6;
    border-bottom: 1px solid #e8c766;
    color: #6b4f00;
    font-family: sans-serif;
    font-size: 13px;
  }

  .skipped-unit {
    font-weight: 600;
    text-decoration: underline dotted;
    cursor: help;
  }

  .network-container {
    flex: 1;
    min-height: 0;
    width: 100%;
  }
</style>
