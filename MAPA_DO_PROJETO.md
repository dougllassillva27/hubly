# Mapa do Projeto: Sol Hub

Este documento mapeia a arquitetura, componentes, gerenciamento de estado e utilitários do projeto **Sol Hub**. Use este guia para entender como as partes se conectam e como estender a aplicação.

---

## 1. Visão Geral da Arquitetura

- **Frontend:** React 18, Vite 5, Tailwind CSS 3.
- **Gerenciamento de Estado:** Zustand (`src/store/useStore.js`).
- **Persistência:** LocalStorage via wrapper customizado (`src/utils/storage.js`).
- **Roteamento:** Inexistente. Trata-se de uma SPA de página única (Single Page Application).
- **Semântica de Estilos:** Variáveis CSS puras injetadas no `:root` e consumidas pelo Tailwind.

---

## 2. Gerenciamento de Estado (`src/store/useStore.js`)

O Zustand atua como a única fonte de verdade da aplicação. Toda alteração de estado que precisa ser lembrada após um refresh é salva simultaneamente no `localStorage`.

### Principais Estados e Ações:

- **Sites:**
  - `sites` (Array de objetos: id, name, url, category, order).
  - `addSite()`, `updateSite()`, `removeSite()`, `reorderSites()`.
- **Categorias:**
  - `categories` (Array de strings).
  - `activeCategory` (Filtro atual).
  - `addCategory()`, `removeCategory()`, `setActiveCategory()`.
- **Temas e Buscas:**
  - `theme`, `setTheme()`: Aplica o tema visual.
  - `searchProvider`, `searchQuery`: Controla qual buscador está ativo e o que está sendo digitado.
- **Notícias (News):**
  - `newsProvider`, `newsTopics`, `newsApiKey`, `newsItems`.
- **Chat AI (DeepSeek):**
  - `deepseekApiKey`, `chatMessages`, `chatOpen`.
- **Modais (UI):**
  - Controle de visibilidade (`settingsOpen`, `addSiteOpen`, `deleteConfirmId`).

**Como Usar:**

```javascript
import useStore from '../store/useStore';
// Dentro do componente:
const { sites, addSite, theme } = useStore();
```

---

## 3. Componentes (`src/components/`)

### Core UI

- **`Clock.jsx`**: Exibe hora e data atuais. Atualiza a cada segundo via `setInterval`.
- **`SearchBar.jsx`**: Barra de pesquisa central. Possui dupla função: filtra os cards localmente e faz busca web no provedor selecionado ao pressionar `Enter`. A tecla `Tab` alterna os provedores.
- **`CategoryFilter.jsx`**: Renderiza as abas de categorias. Altera o `activeCategory` no store para filtrar a grid de sites.
- **`SiteGrid.jsx`**: Grid de sites. Integra `@dnd-kit` para funcionalidade Drag & Drop. Filtra os sites baseando-se na categoria ativa e na busca.
- **`SiteCard.jsx`**: Representa um site individual. Usa `getFaviconUrl` para buscar o ícone. Contém botões de edição e exclusão revelados no hover (`group-hover`).
- **`NewsFeed.jsx`**: Busca e exibe feeds RSS ou notícias via GNews API. Possui auto-refresh de 5 minutos.
- **`StarCanvas.jsx`**: Componente visual (Canvas 2D) que renderiza estrelas animadas. Só é montado se o tema ativo for `space`.

### Modais

- **`SettingsModal.jsx`**: Central de configurações dividida em abas (Tema, Busca, AI Chat, Notícias, Categorias e Dados/Backup).
- **`AddSiteModal.jsx`**: Formulário para adicionar ou editar um site. Lida com a formatação básica da URL (adiciona `https://`).
- **`ConfirmModal.jsx`**: Modal de alerta antes de deletar um site.
- **`AIChatModal.jsx`**: Interface de chat integrada à API do DeepSeek. Lida com chamadas de rede em formato de _stream_ (Server-Sent Events) para digitação em tempo real.

---

## 4. Hooks Customizados (`src/hooks/`)

- **`useNews.js`**: Abstrai a lógica de fetch de notícias. _Nota: Atualmente a lógica também está embutida no componente `NewsFeed.jsx`. Este hook serve para padronização futura._
- **`useSearch.js`**: Hook para gerenciar estado de busca com _debounce_ (atraso de 150ms) para não engasgar a renderização ao digitar rápido.

---

## 5. Utilitários (`src/utils/`)

- **`storage.js`**:
  - Engloba o `localStorage` adicionando o prefixo `sp_` para não conflitar com outras aplicações no mesmo domínio.
  - Contém `defaultSites`, `defaultCategories` e métodos para exportar/importar backup JSON.
- **`favicon.js`**:
  - `getFaviconUrl(url)`: Usa a API pública do Google (`s2/favicons`) para capturar o ícone de qualquer domínio.

---

## 6. Sistema de Temas (`src/themes/themes.js`)

Os temas não usam classes condicionais pesadas. Eles injetam variáveis CSS (`--bg`, `--text`, `--accent`) na raiz (`document.documentElement`).

**Como adicionar um novo tema:**

1. Abra `src/themes/themes.js`.
2. Adicione um novo objeto ao dicionário `themes`:
   ```javascript
   'meu-tema': {
     name: 'Nome do Tema',
     '--bg': '#121212',
     '--card': '#1e1e1e',
     '--text': '#ffffff',
     '--accent': '#ff0000',
     '--muted': '#888888',
     '--border': '#333333',
     '--font': "'Inter', sans-serif",
     '--star': '0', // 1 para ativar o StarCanvas
   }
   ```
3. O tema aparecerá automaticamente nas configurações.

---

## 7. Como Estender e Adicionar Funcionalidades

### Para adicionar uma nova configuração no Settings:

1. No `src/store/useStore.js`: crie o estado inicial, e o método `setX` com persistência (`storage.set('x', val)`).
2. No `src/components/SettingsModal.jsx`: adicione uma nova Aba ou inclua o input na aba existente, conectando-o ao valor do store.

### Para adicionar um novo provedor de busca:

1. No `src/store/useStore.js`: adicione o provedor no array `searchProviders`. Ex:
   ```javascript
   { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Special:Search?search=', color: '#ffffff', icon: 'W', type: 'search' }
   ```
2. A barra de pesquisa (`SearchBar.jsx`) cuidará do resto dinamicamente.

### Fluxo de Trabalho de Modificação (GSD)

1. Mapeie se a alteração é estado global (Zustand) ou local (`useState`).
2. Crie ou modifique o componente no diretório `components/`.
3. Adicione Tailwind baseado em variáveis CSS (ex: `bg-card`, `text-accent`, `border-border`). Evite cores fixas (`bg-red-500`) a menos que seja um alerta de erro/deleção.
