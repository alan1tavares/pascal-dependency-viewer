<script>
  import { canCloseTab } from '../../domain/tabs/index.js';

  let { tabsState, onActivate, onClose } = $props();

  let barEl = $state();

  $effect(() => {
    const activeEl = barEl?.querySelector(`[data-tab-id="${CSS.escape(tabsState.activeId)}"]`);
    activeEl?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  });

  function titleOf(tab) {
    return tab.kind === 'welcome' ? 'Bem-vindo' : tab.title;
  }

  function closeFromButton(event, id) {
    event.stopPropagation();
    onClose(id);
  }
</script>

<div class="tab-bar" role="tablist" bind:this={barEl}>
  {#each tabsState.tabs as tab (tab.id)}
    {@const active = tab.id === tabsState.activeId}
    <div
      class="tab {active ? 'active' : ''}"
      role="tab"
      tabindex="0"
      aria-selected={active}
      data-tab-id={tab.id}
      title={tab.kind === 'graph' ? tab.path : undefined}
      onmousedown={() => onActivate(tab.id)}
      onkeydown={(event) => event.key === 'Enter' && onActivate(tab.id)}
    >
      <span class="tab-title">{titleOf(tab)}</span>
      {#if canCloseTab(tabsState, tab.id)}
        <button
          class="tab-close"
          type="button"
          aria-label="Fechar {titleOf(tab)}"
          onmousedown={(event) => event.stopPropagation()}
          onclick={(event) => closeFromButton(event, tab.id)}
        >×</button>
      {/if}
    </div>
  {/each}
</div>

<style>
  .tab-bar {
    display: flex;
    flex: 0 0 auto;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    background: #f3f3f3;
    border-bottom: 1px solid #ddd;
    font-family: sans-serif;
    font-size: 13px;
    scrollbar-width: thin;
  }

  .tab {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 6px;
    min-width: 80px;
    max-width: 240px;
    padding: 0 6px 0 12px;
    height: 34px;
    box-sizing: border-box;
    border-right: 1px solid #ddd;
    color: #555;
    cursor: pointer;
    user-select: none;
  }

  .tab.active {
    background: white;
    color: #1a1a2e;
    box-shadow: inset 0 2px 0 #ff3e00;
  }

  .tab:focus-visible {
    outline: 2px solid #0066cc;
    outline-offset: -2px;
  }

  .tab-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tab-close {
    flex: 0 0 auto;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: inherit;
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
  }

  .tab-close:hover {
    background: rgba(0, 0, 0, 0.1);
  }
</style>
