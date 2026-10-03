import {
  COMMANDS,
  availableCommands,
  filterCommands,
  shortcutHint,
} from '../../domain/commands/index.js';
import {
  describeRecentProject,
  filterRecentProjects,
} from '../../domain/recentProjects/index.js';
import { filterProjectUnits } from '../../domain/rootUnitSelection/index.js';
import styles from './CommandPalette.css?inline';

const api = window.pascalDependencyViewer;
const isMac = api.platform === 'darwin';

const COMMANDS_MODE = 'commands';
const RECENTS_MODE = 'recents';
const ROOT_UNIT_MODE = 'rootUnit';
const EMPTY_MESSAGES = {
  [COMMANDS_MODE]: 'Nenhum comando encontrado',
  [RECENTS_MODE]: 'Nenhum projeto recente',
  [ROOT_UNIT_MODE]: 'Nenhuma unit encontrada',
};

const TEMPLATE = `
  <div class="overlay">
    <div class="card">
      <div class="input-row">
        <span class="prefix"></span>
        <input type="text" class="input" autocomplete="off" />
      </div>
      <ul class="list"></ul>
      <div class="empty-message"></div>
    </div>
  </div>
`;

export class CommandPalette extends HTMLElement {
  // Private state
  #hasProject = () => false;
  #getProject = () => null;
  #onRootUnitSelected = null;

  #isOpen = false;
  #mode = COMMANDS_MODE;
  #modeEntry = 'palette';
  #closable = true;
  #recentPaths = [];
  #rootUnits = [];
  #rootUnitProjectDir = null;
  #filteredItems = [];
  #selectedIndex = 0;

  #shadowRoot = null;
  #overlay = null;
  #card = null;
  #input = null;
  #prefix = null;
  #list = null;
  #emptyMessage = null;

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const style = document.createElement('style');
    style.textContent = styles;
    this.#shadowRoot.appendChild(style);

    const template = document.createElement('template');
    template.innerHTML = TEMPLATE;
    this.#shadowRoot.appendChild(template.content.cloneNode(true));

    this.#overlay = this.#shadowRoot.querySelector('.overlay');
    this.#card = this.#shadowRoot.querySelector('.card');
    this.#input = this.#shadowRoot.querySelector('.input');
    this.#prefix = this.#shadowRoot.querySelector('.prefix');
    this.#list = this.#shadowRoot.querySelector('.list');
    this.#emptyMessage = this.#shadowRoot.querySelector('.empty-message');

    this.#attachListeners();
  }

  // Public API
  open() {
    if (!this.#closable) return;
    if (this.#isOpen && this.#mode === COMMANDS_MODE) {
      this.#input.focus();
      return;
    }
    this.#isOpen = true;
    this.#enterCommandsMode();
  }

  close() {
    this.#isOpen = false;
    this.#closable = true;
    this.#overlay.classList.remove('open');
    this.dispatchEvent(new CustomEvent('closed'));
  }

  switchMode(mode) {
    if (mode === RECENTS_MODE) {
      return this.#enterRecentsMode('palette');
    }
    if (mode === ROOT_UNIT_MODE) {
      this.#mode = ROOT_UNIT_MODE;
      this.#modeEntry = 'palette';
      this.#closable = true;
      this.#resetInput();
      this.#applyFilter();
      return;
    }
    this.#enterCommandsMode();
  }

  setCommands(commands) {
    // Commands are passed but we use the domain function directly
  }

  setRecentProjects(paths) {
    this.#recentPaths = paths;
  }

  setProjectUnits(units, projectDir) {
    this.#rootUnits = units;
    this.#rootUnitProjectDir = projectDir;
  }

  setHasProject(fn) {
    this.#hasProject = fn;
  }

  setGetProject(fn) {
    this.#getProject = fn;
  }

  setOnRootUnitSelected(fn) {
    this.#onRootUnitSelected = fn;
  }

  get isOpen() {
    return this.#isOpen;
  }

  set closable(value) {
    this.#closable = value;
  }

  get closable() {
    return this.#closable;
  }

  // Private methods
  #renderItem(entry, mode) {
    const item = document.createElement('li');

    if (mode === COMMANDS_MODE) {
      item.classList.add('command-item');
      item.appendChild(document.createTextNode(entry.label));
      const hint = shortcutHint(entry, isMac);
      if (hint) {
        const hintLabel = document.createElement('span');
        hintLabel.className = 'command-hint';
        hintLabel.textContent = hint;
        item.appendChild(hintLabel);
      }
    } else if (mode === RECENTS_MODE) {
      const { fileName, dir } = describeRecentProject(entry);
      item.appendChild(document.createTextNode(fileName));
      const dirLabel = document.createElement('span');
      dirLabel.className = 'recent-dir';
      dirLabel.textContent = dir;
      item.appendChild(dirLabel);
    } else {
      item.appendChild(document.createTextNode(entry.unitName));
      const pathLabel = document.createElement('span');
      pathLabel.className = 'recent-dir';
      pathLabel.textContent = entry.path;
      item.appendChild(pathLabel);
    }

    item.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('selection-confirmed', {
        detail: { item: entry, mode }
      }));
    });
    return item;
  }

  #renderList() {
    this.#list.innerHTML = '';
    this.#emptyMessage.textContent = EMPTY_MESSAGES[this.#mode];
    this.#emptyMessage.classList.toggle('show', this.#filteredItems.length === 0);

    this.#filteredItems.forEach((entry, index) => {
      const item = this.#renderItem(entry, this.#mode);
      if (index === this.#selectedIndex) item.classList.add('selected');
      this.#list.appendChild(item);
    });

    this.#list.children[this.#selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }

  #applyFilter() {
    if (this.#mode === COMMANDS_MODE) {
      this.#filteredItems = filterCommands(
        availableCommands(COMMANDS, { hasProject: this.#hasProject() }),
        this.#input.value,
      );
    } else if (this.#mode === RECENTS_MODE) {
      this.#filteredItems = filterRecentProjects(this.#recentPaths, this.#input.value);
    } else {
      this.#filteredItems = filterProjectUnits(this.#rootUnits, this.#input.value);
    }
    this.#selectedIndex = 0;
    this.#renderList();
  }

  #resetInput() {
    this.#input.value = '';
    if (this.#mode === COMMANDS_MODE) {
      this.#input.placeholder = 'Digite um comando';
      this.#prefix.style.display = 'none';
    } else if (this.#mode === RECENTS_MODE) {
      this.#input.placeholder = '';
      this.#prefix.textContent = 'Abrir recente';
      this.#prefix.style.display = '';
    } else {
      this.#input.placeholder = 'Filtrar por nome ou caminho da unit';
      this.#prefix.style.display = 'none';
    }
  }

  #enterCommandsMode() {
    this.#mode = COMMANDS_MODE;
    this.#closable = true;
    this.#resetInput();
    this.#applyFilter();
    this.#overlay.classList.add('open');
    this.#input.focus();
  }

  async #enterRecentsMode(entry) {
    this.#mode = RECENTS_MODE;
    this.#modeEntry = entry;
    this.#closable = true;
    this.#isOpen = true;

    this.#recentPaths = await api.listRecentProjects();
    if (!this.#isOpen || this.#mode !== RECENTS_MODE) return;
    this.#resetInput();
    this.#applyFilter();
    this.#overlay.classList.add('open');
    this.#input.focus();
  }

  #moveSelection(delta) {
    if (this.#filteredItems.length === 0) return;
    this.#selectedIndex = (this.#selectedIndex + delta + this.#filteredItems.length) % this.#filteredItems.length;
    this.#renderList();
  }

  #confirmSelection() {
    const entry = this.#filteredItems[this.#selectedIndex];
    if (!entry) return;
    this.dispatchEvent(new CustomEvent('selection-confirmed', {
      detail: { item: entry, mode: this.#mode }
    }));
  }

  #leaveOnEscape() {
    if (!this.#closable) return;
    if (this.#mode !== COMMANDS_MODE && this.#modeEntry === 'palette') {
      this.#enterCommandsMode();
    } else {
      this.close();
    }
  }

  #executeCommand(command) {
    if (command.id === 'openRecent') {
      return this.#enterRecentsMode('palette');
    }
    if (command.id === 'selectUnit') {
      const project = this.#getProject();
      this.#mode = ROOT_UNIT_MODE;
      this.#modeEntry = 'palette';
      this.#closable = true;
      this.#rootUnits = project.projectUnits;
      this.#rootUnitProjectDir = project.projectDir;
      this.#isOpen = true;
      this.#resetInput();
      this.#applyFilter();
      this.#overlay.classList.add('open');
      this.#input.focus();
      return;
    }
    this.dispatchEvent(new CustomEvent('selection-confirmed', {
      detail: { item: command, mode: COMMANDS_MODE }
    }));
  }

  #attachListeners() {
    this.#input.addEventListener('input', () => this.#applyFilter());
    this.#input.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.#moveSelection(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.#moveSelection(-1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        this.#confirmSelection();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.#leaveOnEscape();
      }
    });
    this.#overlay.addEventListener('mousedown', (event) => {
      if (!this.#closable) return;
      if (event.target === this.#overlay) this.close();
    });
  }
}

customElements.define('command-palette', CommandPalette);
