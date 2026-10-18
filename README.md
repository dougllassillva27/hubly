<div align="center">
  <img src="assets/img/Hubly%20-%20banner.webp" alt="Hubly Banner" />
</div>

# Hubly

![Status](https://img.shields.io/badge/status-active-success)
![Deploy](https://img.shields.io/badge/deploy-docker%20vps-2496ED)
![License](https://img.shields.io/badge/license-MIT-blue)

**Homepage inteligente, modular e sincronizável para navegador.**

Hubly é uma aplicação web construída com **React 18 + Vite 5 + Tailwind CSS 3**, pensada para funcionar como uma startpage moderna, rápida e personalizável.

O projeto combina experiência de uso simples com uma arquitetura modular, suporte a 7 temas dinâmicos, gestão de sites favoritos, widgets, busca multi-provider, notícias (RSS parser nativo), chat com IA (OpenAI), favicons via cache distribuído e sincronização em nuvem usando **server Express + PostgreSQL (Docker na VPS)**.

- **Acesso:** https://hubly.dougllassillva.com.br
- **Preview:** https://gethubly.netlify.app (deploy legado Netlify, sendo desativado)

---

## Preview

<div align="center">
  <img src="assets/img/Hubly%20-%20preview.webp" alt="Hubly Preview" />
</div>

---

## Highlights técnicos

- **Arquitetura Client-Side (SPA):** UI de baixo acoplamento gerenciada via Zustand.
- **Estratégia Local-First:** todos os dados vivem e fluem do `localStorage`. Sincronização em nuvem é estritamente _opt-in_ (sob demanda).
- **Backend próprio em Express:** as functions serverless originais rodam sem reescrita atrás de um adapter Express→event, expondo as mesmas rotas `/.netlify/functions/*`.
- **Favicon Cache Intelligence:** pipeline tripla (Google S2 → icon.horse → origin) com cache no navegador e persistência assíncrona no Postgres para eliminar layouts quebrados ou atrasos visuais de proxies WAF.
- **Bypass Anti-SSRF e WAF:** proxy de imagens em Node.js com rotação de headers, quebrando bloqueios da Cloudflare e injetando `Cache-Control` (`max-age=31536000`) forçado na renderização.
- **Criptografia Client-Side:** chave da API da OpenAI protegida, cifrada (AES-256 via `crypto-js`) no navegador com a Senha Mestra antes de tocar o localStorage.
- **PWA Instalável:** aplicativo instalável com manifest e cache busting de assets no build.

---

## Arquitetura

```txt
Navegador (React + Vite + Tailwind)
   │
   ├── Estado Global (Zustand)
   ├── Persistência Local (LocalStorage + Crypto)
   ├── UI Modular & Drag'n'Drop (@dnd-kit)
   └── Temas Customizáveis (CSS Variables)
   │
   ▼ HTTPS
Cloudflare (DNS proxied, SSL Full Strict)
   │
   ▼
Nginx (VPS) → Let's Encrypt
   │
   ▼ proxy_pass 127.0.0.1:8300
hubly (container Docker, server Express)
   │
   ├── estático: dist/ (build Vite + versionador)
   └── /.netlify/functions/* (8 handlers originais via adapter)
          ├── rss / futebol-jogos / futebol-noticias / proxy-img / resolver-favicon
          ├── chat → OpenAI (streaming SSE)
          └── sync / favicon → Postgres
   │
   ▼ rede Docker interna
postgres-hubly (PostgreSQL 16, sem porta pública)
```

---

## Estrutura do projeto

```txt
src/
├── App.jsx
├── main.jsx
├── components/
├── hooks/
├── store/
├── themes/
└── utils/

netlify/
├── functions/
└── shim-neon-pg.mjs

server/
└── index.js

docs/
└── sql/

versionamento/
└── versionador.js

tests/
Dockerfile
docker-compose.yml
```

---

## Responsabilidades por pasta/módulo

### `src/`

Toda a aplicação frontend: composição principal da interface, componentes visuais, hooks, store global e utilitários.

- **`src/App.jsx`** — monta a aplicação, aplica tema, inicializa recursos globais e coordena layout, widgets, busca, sites e modais.
- **`src/main.jsx`** — ponto de entrada React renderizado via Vite.
- **`src/store/`** — estado global Zustand (`useStore.js`): sites, categorias, tema, preferências, busca, widgets, sincronização, favicons, modais e comportamento de abertura de links.
- **`src/components/`** — camada visual reutilizável: cards, modais, widgets, barra de busca, listas/grids e elementos de notícias (inclui subpasta `futebol/`).
- **`src/hooks/`** — hooks de integração: notícias (`useNews`), futebol (`useJogosHoje`, `useNoticiasFutebol`), busca (`useSearch`).
- **`src/utils/`** — persistência local (`storage.js`), criptografia (`crypto.js`), favicons (`favicon.js`, `faviconDb.js`).
- **`src/themes/`** — 7 temas via CSS custom properties (`themes.js`).

### `netlify/functions/`

Backend do projeto — handlers no formato Netlify Functions, executados pelo server Express na VPS (ou deployados na Netlify, se usada):

- `rss.js` — proxy de feeds RSS (bypass CORS).
- `proxy-img.js` — proxy de imagens anti-WAF.
- `resolver-favicon.js` — resolução de favicons varrendo HTML/manifests.
- `chat.js` — proxy streaming OpenAI (`text/event-stream`).
- `sync.js` — sincronização opt-in do vault (senha mestra → SHA-256 → upsert em `solhub_sync`).
- `favicon.js` — cache global de favicons (`solhub_favicons`, CRUD por domínio).
- `futebol-jogos.js` / `futebol-noticias.js` — widgets de futebol.
- `shim-neon-pg.mjs` — shim que reimplementa `neon()` sobre `pg` padrão (compatibilidade Postgres comum).

### `server/`

Server Express (`index.js`) que:

- Importa os handlers de `netlify/functions/` intactos via adapter req→event.
- Serve o build estático `dist/` com fallback SPA (`/*` → `index.html`).
- Escuta em `PORT` (padrão 8300), publicado apenas em `127.0.0.1`.

### `docs/sql/`

Scripts de migração do banco (`migration_favicons.sql`). Tabelas: `solhub_sync`, `solhub_favicons`.

### `versionamento/`

`versionador.js` atualiza referências de assets cache no build (`?v=<hash>` em index.html e manifest).

### `tests/`

Testes utilitários do repositório (`node --test`).

---

## Fluxo principal da aplicação

```txt
1. Usuário acessa https://hubly.dougllassillva.com.br
2. Nginx entrega a SPA (dist/ servido pelo Express)
3. React monta a interface e o Zustand carrega estado do localStorage
4. Tema, widgets e sites são aplicados/renderizados
5. Recursos externos (RSS, clima, futebol, chat) passam pelas functions
6. Favicon cache consultado no Postgres e no localStorage
7. Sync em nuvem opcional com a Senha Mestra
```

---

## Persistência

Dois níveis:

**1. Local (padrão):** sites, categorias, tema, preferências, widgets, notas e configurações no `localStorage` (prefixo `sp_`).

**2. Remota (opt-in):** sincronização via Senha Mestra — o token é hasheado em SHA-256 e usado como chave do vault em `solhub_sync (token, data jsonb, updated_at)`. Permite transportar o ambiente entre dispositivos sem conta tradicional.

---

## Segurança e privacidade

- Dados funcionam localmente por padrão; sync é opcional.
- Senha Mestra protege os dados sincronizados (hash SHA-256 no servidor).
- API key da OpenAI é cifrada com AES-256 no navegador antes de persistir.
- Integrações externas passam pelo backend (functions) quando necessário.
- `postgres-hubly` não publica porta: só alcançável pelo container `hubly` na rede Docker.

---

## Sistema de busca

Camada central da experiência: pesquisa em provedores externos, filtro dos sites cadastrados, alternância rápida entre mecanismos e integração com o estado global e a configuração de abertura de links.

Provedores incluídos: Google, Bing, DuckDuckGo, YouTube, Brave, Ecosia.

---

## Sites e categorias

- Cadastro, edição, remoção e organização de sites por categoria.
- Reordenação via drag and drop (@dnd-kit).
- Favicons automáticos com cache em três níveis (localStorage → Postgres → resolução em background).
- Paginação e ordenação por recentes na categoria "Todos".
- Abertura configurável (nova guia ou mesma guia), incluindo clique com botão do meio.

---

## Sistema de temas

| Tema          | Descrição                   |
| ------------- | --------------------------- |
| Minimal Light | Claro, limpo e profissional |
| Minimal Dark  | Escuro elegante             |
| Space         | Visual espacial             |
| Hacking       | Terminal / neon verde       |
| Nord          | Tons frios e suaves         |
| Sunset        | Tons quentes                |
| Cyberpunk     | Neon futurista              |

Troca de tema sem recarregar a aplicação (CSS custom properties aplicadas em `document.documentElement`).

---

## Widgets

- **Clima** — previsão de 7 dias via Open-Meteo, no cabeçalho em desktop e rodapé em mobile.
- **Bloco de notas** — anotações rápidas com persistência local.
- **Notícias** — feeds RSS via function `rss`.
- **Futebol** — jogos do dia e notícias via functions dedicadas.

---

## Backend

Servido por server Express em container Docker (a functionalidade serverless original, hoje em infra própria):

- Mesmas rotas `/.netlify/functions/*`, mantendo compatibilidade total com o frontend.
- Deploy simples via Docker Compose.
- Integrações externas centralizadas (OpenAI, RSS, APIs de futebol).
- Variáveis de ambiente via `.env` (chmod 600).

### Banco de dados

PostgreSQL em container dedicado (`postgres-hubly`):

- Sincronização opt-in (`solhub_sync`).
- Cache global de favicons (`solhub_favicons`).
- Scripts em `docs/sql/`.

---

## Variáveis de ambiente

Configuradas em `.env` do projeto (não versionado):

```env
DATABASE_URL=postgres://hubly:SENHA@postgres-hubly:5432/hubly
POSTGRES_PASSWORD=SENHA
```

---

## Como rodar localmente

```bash
npm install          # dependências
npm run dev          # dev server (Vite)
```

Acesse `http://localhost:5173`.

Modo completo local (com functions + banco):

```bash
# cria o .env conforme seção acima, depois:
docker compose up -d
```

---

## Build

```bash
npm run build        # vite build + versionamento de assets
```

Saída em `dist/`.

---

## Deploy

### Produção (VPS Docker)

```bash
cd /root/dodo/aplicacoes/hubly
git pull
docker compose up -d --build
```

- Container `hubly` publicado apenas em `127.0.0.1:8300`.
- Nginx faz proxy de `hubly.dougllassillva.com.br` com Let's Encrypt.
- Cloudflare proxied com SSL Full (Strict).

### Limitado (Netlify)

O deploy Netlify original (`gethubly.netlify.app`) mantém as functions nativas na plataforma, mas com banco Neon — caminho legado em descontinuação. GitHub Pages hospeda apenas estáticos: sem sync, RSS, futebol ou favicons remotos.

---

## Tecnologias

| Tecnologia          | Responsabilidade                          |
| ------------------- | ----------------------------------------- |
| React 18            | Interface e componentes                   |
| Vite 5              | Build e dev server                        |
| Tailwind CSS 3      | Estilização                               |
| Zustand             | Estado global                             |
| dnd-kit             | Drag and drop                             |
| Express             | Servidor do dist + functions              |
| PostgreSQL (pg)     | Banco remoto (sync + favicons)            |
| crypto-js           | Criptografia AES-256 client-side          |
| @neondatabase/serverless | Driver compat (shim sobre pg)        |
| Open-Meteo          | Clima                                     |
| Node 20 (Docker)    | Runtime                                   |
| JavaScript (ESM)    | Lógica principal                          |

---

## Testes

```bash
npm test             # node --test tests/**/*.test.js
```

Validação de build e smoke test da stack na VPS:

```bash
curl -s -o /dev/null -w '%{http_code}' https://hubly.dougllassillva.com.br/
curl -s https://hubly.dougllassillva.com.br/.netlify/functions/sync -H 'x-sync-token: <senha>'
```

Testes manuais cobertos nas evoluções: cadastro/edição/remoção de site, reordenação, troca de tema, exportação/importação, sync com senha mestra, notícias, futebol, favicons.

---

## Versionamento e cache busting

`versionamento/versionador.js` roda dentro do `npm run build`, acrescentando `?v=<hash>` aos assets em `index.html` e `manifest.json` para invalidar cache após cada deploy.

---

## Fluxo de dados resumido

```txt
Usuário
  ↓
Interface React (Zustand)
  ↓
localStorage (campo primário)
  ↓  (sync opt-in)
Functions Express (/.netlify/functions/*)
  ↓
PostgreSQL (solhub_sync, solhub_favicons) / APIs externas
```

---

## Decisões técnicas

- SPA sem roteador — página única por natureza.
- Zustand sobre Context API para reduzir boilerplate.
- Local-first: usabilidade completa sem sync.
- Functions mantidas no formato Netlify e executadas via adapter Express — o mesmo código roda nas duas plataformas sem reescrita.
- Postgres próprio na VPS em vez de Neon — custo zero, dados na infra pessoal, mesmo padrão dos demais apps do servidor.
- Tailwind + CSS variables para temas sem rebuild.

---

## Licença

Este projeto é uma versão derivada de Orbit, criado por Matheusz Nied.

A base original foi adaptada, expandida e personalizada por Douglas Silva, mantendo a licença original conforme MIT.

---

<div align="center">

Desenvolvido por Douglas Silva

</div>
