<script>
  import { projectStore } from '../stores/project.js';
  import { graphRenderedStore } from '../stores/graph.js';
  import { runCommand } from '../services/ipc.js';

  async function openProject() {
    await runCommand('openProject');
  }
</script>

{#if !$graphRenderedStore}
<div class="welcome">
  <div class="header">
    <h1>Pascal Dependency Viewer</h1>
    <p class="subtitle">Visualize as dependências entre suas units Pascal</p>
  </div>

  {#if $projectStore}
    <div class="project-loaded">
      <div class="success-icon">✓</div>
      <h2>Projeto Carregado</h2>
      <p class="project-path">{$projectStore.projectDir}</p>
      <p class="instructions">
        Selecione uma Unit na paleta de comandos (Cmd/Ctrl+K ou menu Edição) para visualizar o grafo de dependências.
      </p>
    </div>
  {:else}
    <div class="getting-started">
      <div class="empty-icon">📂</div>
      <h2>Bem-vindo!</h2>
      <p class="description">
        Abra um projeto Delphi (.dpr) para começar a visualizar as dependências entre suas units.
      </p>

      <button class="primary-btn" onclick={openProject}>
        Abrir Projeto (.dpr)
      </button>

      <div class="features">
        <h3>O que você pode fazer:</h3>
        <ul>
          <li>📊 Visualizar grafo de dependências de units</li>
          <li>🔍 Filtrar por tipo de cláusula (interface/implementation)</li>
          <li>🔗 Expandir recursivamente dependências</li>
          <li>💾 Acessar projetos recentes rapidamente</li>
        </ul>
      </div>

      <div class="keyboard-shortcuts">
        <h3>Atalhos Úteis:</h3>
        <ul>
          <li><kbd>Cmd/Ctrl+O</kbd> — Abrir projeto</li>
          <li><kbd>Cmd/Ctrl+P</kbd> — Paleta de Comandos</li>
          <li><kbd>Cmd/Ctrl+K R</kbd> — Projetos recentes</li>
        </ul>
      </div>
    </div>
  {/if}
</div>
{/if}

<style>
  .welcome {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    color: #333;
  }

  .header {
    background: white;
    padding: 3rem 2rem;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-bottom: 4px solid #ff3e00;
  }

  h1 {
    margin: 0;
    font-size: 2.5rem;
    color: #1a1a2e;
    font-weight: 700;
  }

  .subtitle {
    margin: 0.5rem 0 0 0;
    font-size: 1.1rem;
    color: #666;
  }

  .getting-started,
  .project-loaded {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
  }

  .empty-icon,
  .success-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.8rem;
    color: #1a1a2e;
  }

  .description,
  .project-path {
    margin: 0 0 2rem 0;
    font-size: 1rem;
    color: #666;
    text-align: center;
    line-height: 1.6;
  }

  .project-path {
    background: white;
    padding: 1rem;
    border-radius: 6px;
    font-family: monospace;
    word-break: break-all;
    color: #333;
    font-size: 0.9rem;
  }

  .instructions {
    font-size: 0.95rem;
    color: #555;
  }

  .primary-btn {
    background: #ff3e00;
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 2rem;
  }

  .primary-btn:hover {
    background: #e63500;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 62, 0, 0.3);
  }

  .primary-btn:active {
    transform: translateY(0);
  }

  .features,
  .keyboard-shortcuts {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    margin-top: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    width: 100%;
  }

  h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: #1a1a2e;
    font-weight: 600;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    padding: 0.5rem 0;
    color: #555;
    line-height: 1.6;
  }

  kbd {
    background: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 3px;
    padding: 0.2rem 0.5rem;
    font-family: monospace;
    font-size: 0.9rem;
    color: #333;
  }

  @media (max-width: 600px) {
    .header {
      padding: 2rem 1rem;
    }

    h1 {
      font-size: 1.8rem;
    }

    .getting-started,
    .project-loaded {
      padding: 1.5rem;
    }

    .features,
    .keyboard-shortcuts {
      padding: 1rem;
    }
  }
</style>
