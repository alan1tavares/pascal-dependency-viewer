<script>
  import {
    COMMANDS,
    availableCommands,
    filterCommands,
    shortcutHint,
  } from "../../domain/commands/index.js";
  import {
    describeRecentProject,
    filterRecentProjects,
  } from "../../domain/recentProjects/index.js";
  import { filterProjectUnits } from "../../domain/rootUnitSelection/index.js";
  import { renderGraph } from "./graphView.js";
  import { markGraphRendered } from "../stores/graph.js";

  const api = window.pascalDependencyViewer;
  const isMac = api.platform === "darwin";

  const COMMANDS_MODE = "commands";
  const RECENTS_MODE = "recents";
  const ROOT_UNIT_MODE = "rootUnit";
  const EMPTY_MESSAGES = {
    [COMMANDS_MODE]: "Nenhum comando encontrado",
    [RECENTS_MODE]: "Nenhum projeto recente",
    [ROOT_UNIT_MODE]: "Nenhuma unit encontrada",
  };

  let hasProject = $state(() => false);
  let getProject = $state(() => null);
  let onRootUnitSelected = $state(null);

  let isOpen = $state(false);
  let mode = $state(COMMANDS_MODE);
  let modeEntry = $state("palette");
  let closable = $state(true);
  let recentPaths = $state([]);
  let rootUnits = $state([]);
  let rootUnitProjectDir = $state(null);
  let filteredItems = $state([]);
  let selectedIndex = $state(0);
  let inputValue = $state("");

  let inputEl = $state();

  let placeholderText = $derived(
    mode === COMMANDS_MODE
      ? 'Digite um comando'
      : mode === RECENTS_MODE
        ? 'Escolha o projeto'
        : 'Filtrar por nome ou caminho da unit'
  );

  $effect(() => {
    if (isOpen && inputEl) {
      inputEl.focus();
    }
  });

  $effect(() => {
    if (inputEl) {
      inputEl.placeholder = placeholderText;
    }
  });

  export function configure(options) {
    hasProject = options.hasProject;
    getProject = options.getProject;
    onRootUnitSelected = options.onRootUnitSelected;
  }

  function closeCommandPalette() {
    isOpen = false;
    closable = true;
    document.body.style.overflow = '';
  }

  function openRecentProject(filePath) {
    closeCommandPalette();
    api.openRecentProject(filePath);
  }

  async function selectRootUnit(projectUnit) {
    const simplifiedUnits = rootUnits.map(unit => ({
      path: unit.path,
      unitName: unit.unitName,
    }));
    const graph = await api.expandFromRootUnit({
      projectDir: rootUnitProjectDir,
      projectUnit: { path: projectUnit.path, unitName: projectUnit.unitName },
      projectUnits: simplifiedUnits,
    });
    renderGraph(graph.nodes, graph.edges, graph.rootUnitId);
    markGraphRendered();
    onRootUnitSelected?.();
    closeCommandPalette();
  }

  function executeCommand(command) {
    if (command.id === "openRecent") {
      enterRecentsMode("palette");
      return;
    }
    if (command.id === "selectUnit") {
      const project = getProject();
      enterRootUnitMode(project.projectUnits, project.projectDir, {
        entry: "palette",
        closable: true,
      });
      return;
    }
    closeCommandPalette();
    api.runCommand(command.id);
  }

  function applyFilter() {
    if (mode === COMMANDS_MODE) {
      filteredItems = filterCommands(
        availableCommands(COMMANDS, { hasProject: hasProject() }),
        inputValue,
      );
    } else if (mode === RECENTS_MODE) {
      filteredItems = filterRecentProjects(recentPaths, inputValue);
    } else {
      filteredItems = filterProjectUnits(rootUnits, inputValue);
    }
    selectedIndex = 0;
  }

  function resetInput() {
    inputValue = "";
    applyFilter();
  }

  function enterCommandsMode() {
    mode = COMMANDS_MODE;
    closable = true;
    resetInput();
    document.body.style.overflow = 'hidden';
  }

  async function enterRecentsMode(entry) {
    mode = RECENTS_MODE;
    modeEntry = entry;
    closable = true;
    isOpen = true;
    document.body.style.overflow = 'hidden';
    filteredItems = [];
    inputValue = '';

    recentPaths = await api.listRecentProjects();
    if (!isOpen || mode !== RECENTS_MODE) return;
    resetInput();
  }

  export function enterRootUnitMode(
    projectUnits,
    projectDir,
    { entry, closable: isClosable } = {},
  ) {
    mode = ROOT_UNIT_MODE;
    modeEntry = entry;
    closable = Boolean(isClosable);
    rootUnits = projectUnits;
    rootUnitProjectDir = projectDir;
    isOpen = true;
    document.body.style.overflow = 'hidden';

    resetInput();
  }

  function moveSelection(delta) {
    if (filteredItems.length === 0) return;
    selectedIndex =
      (selectedIndex + delta + filteredItems.length) % filteredItems.length;
  }

  function confirmSelection() {
    const entry = filteredItems[selectedIndex];
    if (!entry) return;
    if (mode === COMMANDS_MODE) executeCommand(entry);
    else if (mode === RECENTS_MODE) openRecentProject(entry);
    else selectRootUnit(entry);
  }

  function leaveOnEscape() {
    if (!closable) return;
    if (mode !== COMMANDS_MODE && modeEntry === "palette") enterCommandsMode();
    else closeCommandPalette();
  }

  function handleKeydown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveSelection(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveSelection(-1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      confirmSelection();
    } else if (event.key === "Escape") {
      event.preventDefault();
      leaveOnEscape();
    }
  }

  function handleOverlayMousedown(event) {
    if (!closable) return;
    if (event.target === overlayEl) closeCommandPalette();
  }

  export function showCommandPalette() {
    if (!closable) return;
    if (isOpen && mode === COMMANDS_MODE) {
      return;
    }
    isOpen = true;
    enterCommandsMode();
  }

  export function showOpenRecent() {
    if (!closable) return;
    if (isOpen && mode === RECENTS_MODE) {
      if (inputEl) inputEl.focus();
      return;
    }
    return enterRecentsMode("direct");
  }

  function getItemKey(entry, idx) {
    if (mode === COMMANDS_MODE) return entry.id;
    if (mode === RECENTS_MODE) return entry;
    return entry.path;
  }

  function renderCommandItem(command) {
    const hint = shortcutHint(command, isMac);
    return { command, hint };
  }

  function renderRecentItem(filePath) {
    const { fileName, dir } = describeRecentProject(filePath);
    return { fileName, dir, filePath };
  }

  function renderRootUnitItem(projectUnit) {
    return {
      unitName: projectUnit.unitName,
      path: projectUnit.path,
      projectUnit,
    };
  }
</script>

{#if isOpen}
  <div
    id="commandPaletteOverlay"
    onmousedown={handleOverlayMousedown}
    role="presentation"
  >
    <div class="commandPaletteCard" role="dialog" aria-modal="true">
    <input
      id="commandPaletteInput"
      bind:this={inputEl}
      bind:value={inputValue}
      oninput={applyFilter}
      onkeydown={handleKeydown}
      type="text"
      class="commandInput"
      placeholder={placeholderText}
    />
    <ul id="commandPaletteList" class="commandList" role="listbox">
      {#each filteredItems as entry, idx (getItemKey(entry, idx))}
        {#if mode === COMMANDS_MODE}
          {@const { command, hint } = renderCommandItem(entry)}
          <li role="option" aria-selected={idx === selectedIndex}>
            <button
              class="commandItem {idx === selectedIndex ? 'selected' : ''}"
              onclick={() => executeCommand(command)}
              type="button"
            >
              <span>{command.label}</span>
              {#if hint}
                <span class="commandHint">{hint}</span>
              {/if}
            </button>
          </li>
        {:else if mode === RECENTS_MODE}
          {@const { fileName, dir } = renderRecentItem(entry)}
          <li role="option" aria-selected={idx === selectedIndex}>
            <button
              class="commandItem {idx === selectedIndex ? 'selected' : ''}"
              onclick={() => openRecentProject(entry)}
              type="button"
            >
              <span>{fileName}</span>
              <span class="recentDir">{dir}</span>
            </button>
          </li>
        {:else}
          {@const { unitName, path, projectUnit } = renderRootUnitItem(entry)}
          <li role="option" aria-selected={idx === selectedIndex}>
            <button
              class="commandItem {idx === selectedIndex ? 'selected' : ''}"
              onclick={() => selectRootUnit(projectUnit)}
              type="button"
            >
              <span>{unitName}</span>
              <span class="recentDir">{path}</span>
            </button>
          </li>
        {/if}
      {/each}
    </ul>
    {#if filteredItems.length === 0}
      <div
        id="commandPaletteEmpty"
        class="commandEmpty"
      >
        {EMPTY_MESSAGES[mode]}
      </div>
    {/if}
    </div>
  </div>
{/if}

<style>
  #commandPaletteOverlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 48px;
    z-index: 1000;
  }

  .commandPaletteCard {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    width: 90%;
    max-width: 600px;
    max-height: 400px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .commandInput {
    padding: 12px 16px;
    border: none;
    border-bottom: 1px solid #eee;
    font-size: 14px;
    outline: none;
  }

  .commandInput:focus {
    background: #f9f9f9;
  }

  .commandList {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    flex: 1;
  }

  .commandItem {
    width: 100%;
    padding: 12px 16px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    border: none;
    border-bottom: 1px solid #f0f0f0;
    background: transparent;
    font: inherit;
    text-align: left;
  }

  .commandItem:hover,
  .commandItem.selected {
    background: #f0f0f0;
  }

  .commandItem:focus-visible {
    outline: 2px solid #0066cc;
    outline-offset: -2px;
  }

  .commandHint,
  .recentDir {
    font-size: 12px;
    color: #999;
  }

  .commandEmpty {
    padding: 20px 16px;
    text-align: center;
    color: #999;
    font-size: 13px;
  }
</style>
