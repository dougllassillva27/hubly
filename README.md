<div align="center">
  <img src="assets/img/Hubly%20-%20banner.webp" alt="Hubly Banner" />
</div>

# 🚀 Hubly

![Status](https://img.shields.io/badge/status-active-success)
![Deploy](https://img.shields.io/badge/deploy-netlify-00C7B7)
![License](https://img.shields.io/badge/license-MIT-blue)

**Homepage inteligente, modular e sincronizável para navegador.**

Hubly é uma aplicação web construída com **React + Vite + Tailwind CSS**, pensada para funcionar como uma homepage moderna, rápida e personalizável.

O projeto combina experiência de uso simples com uma arquitetura modular, suporte a temas, gestão de sites favoritos, widgets, busca inteligente, notícias, futebol, favicons automáticos e sincronização opcional em nuvem usando **Netlify Functions + Neon DB/PostgreSQL**.

🔗 **Acesse:** https://gethubly.netlify.app/

---

## 🔗 Demo

Acesse a aplicação em produção:

👉 https://gethubly.netlify.app/

---

## 🌌 Preview

<div align="center">
  <img src="assets/img/Hubly%20-%20preview.webp" alt="Hubly Preview" />
</div>

---

## 🧠 Visão geral técnica

O Hubly é uma **SPA** com backend serverless opcional.

A aplicação foi organizada para separar responsabilidades entre:

- **Interface:** componentes React reutilizáveis.
- **Estado global:** store central com Zustand.
- **Regras auxiliares:** utilitários em `utils`.
- **Integrações externas:** Netlify Functions.
- **Persistência local:** navegador.
- **Persistência remota opcional:** Neon DB/PostgreSQL.
- **Automação de cache:** script de versionamento.

---

## ⚙️ Highlights técnicos

- Arquitetura modular com separação por responsabilidade
- Estado global com baixo acoplamento (Zustand)
- Backend serverless desacoplado
- Estratégia local-first com sync opcional
- Cache inteligente de recursos (favicons)

---

## 🏗️ Arquitetura

```txt
Navegador
   │
   ▼
React + Vite + Tailwind
   │
   ├── Estado global com Zustand
   │
   ├── Persistência local
   │
   ├── Temas e preferências
   │
   ├── Sites, categorias e widgets
   │
   └── UI modular
   │
   ▼
Netlify Functions
   │
   ├── Notícias / RSS
   │
   ├── Futebol
   │
   ├── Favicons
   │
   └── Sincronização
   │
   ▼
Neon DB / PostgreSQL
```

---

## 📁 Estrutura do projeto

```txt
src/
├── App.jsx
├── main.jsx
├── components/
├── hooks/
├── store/
└── utils/

netlify/
└── functions/

docs/
└── sql/

versionamento/
└── versionador.js

public/
assets/
```

---

## 📦 Responsabilidades por pasta

### `src/`

Contém toda a aplicação frontend.

É onde ficam a composição principal da interface, componentes visuais, hooks, store global e utilitários.

---

### `src/App.jsx`

Responsável por montar a aplicação.

Principais responsabilidades:

- Carregar estrutura visual principal.
- Aplicar tema atual.
- Inicializar recursos globais.
- Conectar layout, widgets, busca, sites e modais.
- Coordenar a experiência principal da SPA.

---

### `src/main.jsx`

Ponto de entrada da aplicação React.

Responsável por renderizar o app dentro do DOM usando Vite.

---

### `src/store/`

Camada de estado global.

O projeto utiliza **Zustand** para centralizar dados e ações da aplicação.

Responsabilidades típicas:

- Sites cadastrados.
- Categorias.
- Tema ativo.
- Preferências do usuário.
- Busca.
- Configurações de widgets.
- Sincronização.
- Favicons.
- Estado de modais e interações globais.

---

### `src/components/`

Camada visual da aplicação.

Responsável por componentes reutilizáveis da interface, como:

- Cards.
- Modais.
- Widgets.
- Barra de busca.
- Seletor de tema.
- Gerenciamento de sites.
- Listas e grids.
- Elementos de notícias e futebol.

---

### `src/hooks/`

Hooks customizados para encapsular comportamentos reutilizáveis.

Responsabilidades esperadas:

- Carregamento de dados externos.
- Integração com notícias.
- Integração com futebol.
- Busca.
- Estados derivados da interface.

---

### `src/utils/`

Funções auxiliares e integrações internas.

Responsabilidades principais:

- Persistência local.
- Criptografia local.
- Integração com banco.
- Resolução de favicons.
- Tratamento de dados.
- Helpers compartilhados.

---

### `netlify/functions/`

Backend serverless do projeto.

Essa pasta contém funções executadas pela Netlify, usadas para recursos que não devem depender apenas do frontend.

Responsabilidades:

- Buscar notícias via RSS.
- Consultar dados de futebol.
- Resolver ou armazenar favicons.
- Sincronizar dados com banco remoto.
- Intermediar chamadas externas quando necessário.

---

### `docs/sql/`

Documentação e scripts SQL relacionados ao banco.

Usado para estruturar tabelas e recursos necessários no **Neon DB/PostgreSQL**.

---

### `versionamento/`

Contém automação de versionamento/cache busting.

O script `versionador.js` permite atualizar referências de assets durante o build, evitando problemas de cache no deploy.

---

## 🔄 Fluxo principal da aplicação

```txt
1. Usuário acessa o Hubly
2. Vite entrega a SPA
3. React monta a interface
4. Zustand carrega estado persistido
5. Preferências e tema são aplicados
6. Sites, categorias e widgets são renderizados
7. Recursos externos são consultados quando necessário
8. Dados locais podem ser sincronizados com Neon DB
```

---

## 💾 Persistência

O Hubly trabalha com dois níveis de persistência.

### 1. Persistência local

Dados salvos no navegador.

Usada para:

- Sites.
- Categorias.
- Tema.
- Preferências.
- Widgets.
- Configurações gerais.

### 2. Persistência remota opcional

Sincronização usando:

- Netlify Functions.
- Neon DB/PostgreSQL.
- Senha mestra.
- Criptografia local para dados sensíveis.

Essa camada permite transportar o ambiente entre dispositivos sem exigir uma conta tradicional.

---

## 🔐 Segurança e privacidade

O Hubly prioriza controle local dos dados.

Pontos importantes:

- Dados funcionam localmente por padrão.
- Sincronização é opcional.
- Senha mestra é usada para proteger dados sincronizados.
- Dados sensíveis podem ser tratados com criptografia local.
- Integrações externas passam por backend serverless quando necessário.

---

## 🔎 Sistema de busca

A busca do Hubly atua como camada central da experiência.

Principais recursos:

- Pesquisa em provedores externos.
- Filtro de sites cadastrados.
- Alternância rápida entre mecanismos.
- Integração com o estado global.

Exemplos de provedores:

- Google.
- Bing.
- DuckDuckGo.
- YouTube.
- Brave.
- Ecosia.

---

## 🧱 Sites e categorias

O núcleo da aplicação gira em torno da gestão de atalhos.

Recursos:

- Cadastro de sites.
- Edição.
- Remoção.
- Organização por categoria.
- Reordenação via drag and drop.
- Favicons automáticos.
- Cache inteligente de ícones.

---

## 🎨 Sistema de temas

O Hubly possui 8 temas visuais:

| Tema          | Descrição                   |
| ------------- | --------------------------- |
| Minimal Light | Claro, limpo e profissional |
| Minimal Dark  | Escuro elegante             |
| Space         | Visual espacial             |
| Hacking       | Terminal / neon verde       |
| Nord          | Tons frios e suaves         |
| Sunset        | Tons quentes                |
| Cyberpunk     | Neon futurista              |
| Amoled Black  | Preto absoluto              |

A troca de tema é feita sem recarregar a aplicação.

---

## 🛠️ Widgets

O projeto possui widgets integrados para enriquecer a homepage.

### 🌦️ Clima

Consulta previsão e informações meteorológicas usando Open-Meteo.

### 📝 Bloco de notas

Permite anotações rápidas com persistência.

### 📰 Notícias

Consome feeds RSS via Netlify Functions.

### ⚽ Futebol

Consulta dados esportivos por API externa.

---

## 🌐 Backend serverless

O backend do Hubly não é um servidor tradicional.

Ele usa **Netlify Functions**, permitindo:

- Deploy simples.
- Menos infraestrutura.
- Integrações seguras.
- Separação entre frontend e chamadas externas.
- Uso de variáveis de ambiente no painel da Netlify.

---

## 🐘 Banco de dados

O projeto usa **Neon DB/PostgreSQL** para recursos remotos.

Principais usos:

- Sincronização opcional.
- Cache global de favicons.
- Persistência de dados compartilháveis entre dispositivos.

Scripts e estrutura ficam documentados em:

```txt
docs/sql/
```

---

## ⚙️ Variáveis de ambiente

As variáveis devem ser configuradas no ambiente de deploy da Netlify.

Exemplos esperados conforme integrações do projeto:

```env
DATABASE_URL=
FOOTBALL_API_KEY=
```

> Os nomes finais devem seguir exatamente o que estiver implementado nas Netlify Functions do projeto.

---

## 🚀 Como rodar localmente

Instale as dependências:

```bash
npm install
```

Execute o ambiente de desenvolvimento:

```bash
npm run dev
```

Acesse:

```txt
http://localhost:5173
```

---

## 🏗️ Build

Gere a versão de produção:

```bash
npm run build
```

O build final será gerado em:

```txt
dist/
```

---

## 🌍 Deploy

### Recomendado

```txt
Netlify
```

Motivo:

- Suporte nativo às Netlify Functions.
- Configuração simples.
- Compatível com SPA.
- Integração direta com variáveis de ambiente.
- Deploy automático via Git.

### Limitado

```txt
GitHub Pages
```

Limitação:

- Hospeda apenas arquivos estáticos.
- Não executa Netlify Functions.
- Recursos como sync, RSS, futebol e favicons remotos podem não funcionar corretamente.

---

## 🧰 Tecnologias

| Tecnologia         | Responsabilidade        |
| ------------------ | ----------------------- |
| React 18           | Interface e componentes |
| Vite               | Build e dev server      |
| Tailwind CSS       | Estilização             |
| Zustand            | Estado global           |
| dnd-kit            | Drag and drop           |
| Netlify Functions  | Backend serverless      |
| Neon DB/PostgreSQL | Banco remoto            |
| Open-Meteo         | Clima                   |
| RSS                | Notícias                |
| JavaScript         | Lógica principal        |
| SQL                | Estrutura de banco      |

---

## 🧪 Testes

No estado atual, o projeto não possui testes automatizados detectados.

Validações recomendadas durante evolução:

```txt
npm run build
```

Testar manualmente:

- Cadastro de site.
- Edição de site.
- Remoção de site.
- Reordenação.
- Troca de tema.
- Exportação/importação.
- Sync com senha mestra.
- Notícias.
- Futebol.
- Favicons.
- Deploy na Netlify.

---

## 📦 Versionamento e cache busting

O projeto possui um script dedicado em:

```txt
versionamento/versionador.js
```

Uso esperado no `package.json`:

```json
{
  "scripts": {
    "build": "node versionamento/versionador.js"
  }
}
```

Esse fluxo ajuda a evitar problemas de cache em assets estáticos após deploy.

---

## 🧭 Fluxo de dados resumido

```txt
Usuário
  ↓
Interface React
  ↓
Zustand Store
  ↓
Local Storage / Estado Local
  ↓
Netlify Functions
  ↓
Neon DB / APIs externas
```

---

## 📌 Decisões técnicas

- SPA para navegação rápida.
- Zustand em vez de Context API para reduzir boilerplate.
- Netlify Functions para esconder integrações externas sensíveis.
- Neon DB para persistência remota leve.
- Local-first para manter usabilidade mesmo sem sync.
- Tailwind para velocidade de UI.
- Vite para desenvolvimento e build rápidos.

---

## 📄 Licença

Este projeto é uma versão derivada de Orbit, criado por Matheusz Nied.

A base original foi adaptada, expandida e personalizada por Douglas Silva, mantendo a licença original conforme MIT.

---

<div align="center">

✨ Desenvolvido por Douglas Silva ✨

</div>
