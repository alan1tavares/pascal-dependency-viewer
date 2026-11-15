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
  import { filterMethods } from "../../domain/methodSelection/index.js";
  import { ipcErrorCode } from "../../domain/ipcErrors/index.js";

  const api = window.pascalDependencyViewer;
  const isMac = api.platform === "darwin";

  const COMMANDS_MODE = "commands";
  const RECENTS_MODE = "recents";
  const ROOT_UNIT_MODE = "rootUnit";
  const METHOD_MODE = "method";
  const EMPTY_MESSAGES = {
    [COMMANDS_MODE]: "Nenhum comando encontrado",
    [RECENTS_MODE]: "Nenhum projeto recente",
    [ROOT_UNIT_MODE]: "Nenhuma unit encontrada",
    [METHOD_MODE]: "Nenhum método encontrado",
  };

  let hasProject = $state(() => false);
  let getProject = $state(() => null);
  let getActiveTabKind = $state(() => "welcome");
  let getActiveUnit = $state(() => null);
  let onRootUnitSelected = $state(null);
  let onMethodSelected = $state(null);

  // Modo `Selecionar Método`: Unit capturada na entrada, estado da análise
  // (`loading` | `ready` | `skipped`) e um token que descarta respostas que
  // chegam depois de a paleta ter mudado de modo, de Unit ou fechado.
  let methodUnit = $state(null);
  let methodStatus = $state("loading");
  let methods = $state([]);
  let skippedReason = $state("");
  let methodRequest = 0;

  let isOpen = $state(false);
  let mode = $state(COMMANDS_MODE);
  let modeEntry = $state("palette");
  let recentPaths = $state([]);
  let rootUnits = $state([]);
  let rootUnitProjectDir = $state(null);
  let filteredItems = $state([]);
  let selectedIndex = $state(0);
  let inputValue = $state("");

  let inputEl = $state();
  let overlayEl = $state();

  let placeholderText = $derived(
    mode === COMMANDS_MODE
      ? 'Digite um comando'
      : mode === RECENTS_MODE
        ? 'Escolha o projeto'
        : mode === METHOD_MODE
          ? 'Digite o nome do método'
          : 'Filtrar por nome ou caminho da unit'
  );

  let emptyMessage = $derived.by(() => {
    if (mode !== METHOD_MODE) return EMPTY_MESSAGES[mode];
    if (methodStatus === "loading") return "Analisando Project…";
    if (methodStatus === "skipped") return `Não foi possível analisar esta Unit: ${skippedReason}`;
    if (methods.length === 0) return "Esta Unit não tem métodos";
    return EMPTY_MESSAGES[METHOD_MODE];
  });

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
    getActiveTabKind = options.getActiveTabKind ?? (() => "welcome");
    getActiveUnit = options.getActiveUnit ?? (() => null);
    onRootUnitSelected = options.onRootUnitSelected;
    onMethodSelected = options.onMethodSelected;
  }

  export function isPaletteOpen() {
    return isOpen;
  }

  function closeCommandPalette() {
    isOpen = false;
    document.body.style.overflow = '';
  }

  function openRecentProject(filePath) {
    closeCommandPalette();
    api.openRecentProject(filePath);
  }

  function selectRootUnit(projectUnit) {
    closeCommandPalette();
    onRootUnitSelected?.(projectUnit);
  }

  function selectMethod(method) {
    const unit = methodUnit;
    closeCommandPalette();
    onMethodSelected?.(method, unit);
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
      });
      return;
    }
    if (command.id === "selectMethod") {
      const unit = getActiveUnit();
      if (unit) enterMethodMode(unit, { entry: "palette" });
      return;
    }
    closeCommandPalette();
    api.runCommand(command.id);
  }

  function applyFilter() {
    if (mode === COMMANDS_MODE) {
      filteredItems = filterCommands(
        availableCommands(COMMANDS, {
          hasProject: hasProject(),
          activeTabKind: getActiveTabKind(),
        }),
        inputValue,
      );
    } else if (mode === RECENTS_MODE) {
      filteredItems = filterRecentProjects(recentPaths, inputValue);
    } else if (mode === METHOD_MODE) {
      filteredItems = methodStatus === "ready" ? filterMethods(methods, inputValue) : [];
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
    resetInput();
    document.body.style.overflow = 'hidden';
  }

  async function enterRecentsMode(entry) {
    mode = RECENTS_MODE;
    modeEntry = entry;
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
    { entry } = {},
  ) {
    mode = ROOT_UNIT_MODE;
    modeEntry = entry;
    rootUnits = projectUnits;
    rootUnitProjectDir = projectDir;
    isOpen = true;
    document.body.style.overflow = 'hidden';

    resetInput();
  }

  // `unit`: { unitName, path } da Root Unit da Unit Tab ativa.
  export function enterMethodMode(unit, { entry } = {}) {
    mode = METHOD_MODE;
    modeEntry = entry;
    methodUnit = unit;
    methodStatus = "loading";
    methods = [];
    skippedReason = "";
    isOpen = true;
    document.body.style.overflow = 'hidden';
    resetInput();

    const request = ++methodRequest;
    const isCurrent = () => request === methodRequest && isOpen && mode === METHOD_MODE;
    api.listUnitMethods(unit.unitName).then(
      (result) => {
        if (!isCurrent()) return;
        if (result.skipped) {
          methodStatus = "skipped";
          skippedReason = result.skipped;
        } else {
          methods = result.methods;
          methodStatus = "ready";
        }
        // O texto digitado durante a análise vale como filtro.
        applyFilter();
      },
      (error) => {
        if (!isCurrent()) return;
        // Outro Project foi carregado: o fluxo dele segue sem aviso.
        if (ipcErrorCode(error) === "PROJECT_REPLACED") return;
        closeCommandPalette();
        window.alert(`Não foi possível listar os métodos de ${unit.unitName}: ${error.message}`);
      },
    );
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
    else if (mode === METHOD_MODE) selectMethod(entry);
    else selectRootUnit(entry);
  }

  function leaveOnEscape() {
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
    if (event.target === overlayEl) closeCommandPalette();
  }

  export function showCommandPalette() {
    if (isOpen && mode === COMMANDS_MODE) {
      return;
    }
    isOpen = true;
    enterCommandsMode();
  }

  export function showOpenRecent() {
    if (isOpen && mode === RECENTS_MODE) {
      if (inputEl) inputEl.focus();
      return;
    }
    return enterRecentsMode("direct");
  }

  function getItemKey(entry, idx) {
    if (mode === COMMANDS_MODE) return entry.id;
    if (mode === RECENTS_MODE) return entry;
    if (mode === METHOD_MODE) return entry.id;
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
    bind:this={overlayEl}
    onmousedown={handleOverlayMousedown}
    role="presentation"
  >
    <div class="commandPaletteCard" role="dialog" aria-modal="true">
    {#if mode === METHOD_MODE}
      <div class="commandPrefix" id="commandPalettePrefix">Selecionar Método</div>
    {/if}
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
        {:else if mode === METHOD_MODE}
          <li role="option" aria-selected={idx === selectedIndex}>
            <button
              class="commandItem {idx === selectedIndex ? 'selected' : ''}"
              onclick={() => selectMethod(entry)}
              type="button"
            >
              <span>{entry.label}</span>
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
        {emptyMessage}
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

  .commandPrefix {
    padding: 8px 16px 0;
    font-size: 12px;
    font-weight: 600;
    color: #555;
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
