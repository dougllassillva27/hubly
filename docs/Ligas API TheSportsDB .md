# ⚽ Hubly Football Provider — TheSportsDB Integration

![Status](https://img.shields.io/badge/status-active-success)
![Provider](https://img.shields.io/badge/provider-TheSportsDB-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 🚀 Visão Geral

Este módulo do **Hubly** integra o novo provedor de dados esportivos **TheSportsDB**, substituindo o provider anterior.

A proposta é oferecer uma camada **organizada, padronizada e escalável**, transformando respostas **cruas (flat JSON)** em uma estrutura pronta para consumo no frontend.

---

## 🔗 Base da API

Endpoints utilizados:

### 📚 Ligas por país

```
https://www.thesportsdb.com/api/v1/json/123/search_all_leagues.php?c={country}&s=Soccer
```

### 📅 Jogos por data

```
https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d={date}&s=Soccer
```

### 🌍 Todas as ligas

```
https://www.thesportsdb.com/api/v1/json/123/all_leagues.php
```

---

## 🧠 Problema do Provider

A API retorna dados **não estruturados**, com:

- País misturado com liga
- Tipos de competição sem separação (nacional/estadual)
- Falta de hierarquia
- Dados redundantes ou inconsistentes

---

## 🏗️ Solução Implementada

O Hubly aplica uma camada de normalização:

### ✅ Estrutura final

```
País
 ├── Ligas Nacionais
 └── Ligas Estaduais
```

---

## 📦 Estrutura de Dados (Padronizada)

```json
{
  "Brazil": {
    "nacionais": [
      {
        "id": "5201",
        "nome": "Brasileirão Feminino A1",
        "api_nome": "Brazil Brasileiro Women",
        "divisao": 1,
        "genero": "Feminino",
        "temporada": "2026"
      }
    ],
    "estaduais": {
      "Acre": [
        {
          "id": "5676",
          "nome": "Campeonato Acreano",
          "divisao": 1
        }
      ]
    }
  }
}
```

---

## 🧩 Mapeamento de Campos

| Campo API            | Campo Hubly | Descrição             |
| -------------------- | ----------- | --------------------- |
| `idLeague`           | `id`        | Identificador da liga |
| `strLeague`          | `api_nome`  | Nome original da API  |
| `strLeagueAlternate` | `nome`      | Nome amigável         |
| `intDivision`        | `divisao`   | Nível da competição   |
| `strGender`          | `genero`    | Masculino/Feminino    |
| `strCountry`         | `pais`      | País da liga          |
| `strCurrentSeason`   | `temporada` | Temporada atual       |

---

## ⚙️ Regras de Normalização

### 1. Classificação de liga

```js
function tipoLiga(liga) {
  const nome = liga.strLeague.toLowerCase();

  if (nome.includes('serie') || nome.includes('brasileiro')) {
    return 'nacional';
  }

  return 'estadual';
}
```

---

### 2. Agrupamento por país

```js
function agruparPorPais(dados) {
  return dados.reduce((acc, liga) => {
    const pais = liga.strCountry;

    if (!acc[pais]) {
      acc[pais] = {
        nacionais: [],
        estaduais: {},
      };
    }

    return acc;
  }, {});
}
```

---

### 3. Separação estadual por região

```js
function extrairEstado(nomeLiga) {
  const estados = ['Acre', 'Alagoano', 'Amapaense'];

  return estados.find((e) => nomeLiga.includes(e)) || 'Outros';
}
```

---

## 🎯 Highlights Técnicos

- Estrutura modular por responsabilidade
- Normalização de dados em tempo real
- Baixo acoplamento com provider
- Preparado para múltiplas APIs
- Estratégia **local-first + cache**
- Suporte a fallback de provider

---

## 📅 Estrutura de Eventos

```json
{
  "id": "2265366",
  "liga": "Italian Serie A",
  "data": "2026-04-25",
  "hora": "18:00",
  "time_casa": "Bologna",
  "time_fora": "Roma",
  "status": "Not Started"
}
```

---

## 🧠 Estratégia de Performance

- Cache local (localStorage)
- Evitar chamadas duplicadas
- Lazy loading por país
- Atualização sob demanda

---

## 🔐 Segurança

- Sem armazenamento de credenciais no frontend
- Uso de endpoints públicos
- Preparado para proxy backend (futuro)

---

## 📌 Roadmap

- [ ] Adicionar prioridades de ligas (ranking)
- [ ] Cache persistente inteligente
- [ ] Integração com múltiplos providers
- [ ] UI dinâmica por país/competição
- [ ] Filtro por gênero (masculino/feminino)

---

## 🧪 Exemplo de Uso

```js
const resposta = await fetch(API_URL);
const dados = await resposta.json();

const normalizado = normalizarDados(dados);
renderizarUI(normalizado);
```

---

## 🧾 Licença

MIT — livre para uso e modificação.

---

## 👨‍💻 Autor

Projeto desenvolvido para o ecossistema **Hubly**
Foco em performance, organização e escalabilidade.

---

## 🔗 Demo

Acesse a aplicação em produção:

👉 https://gethubly.netlify.app/

---

## ⚡ Conclusão

A integração com o **TheSportsDB** transforma uma API desorganizada em uma base sólida, escalável e pronta para UI moderna — mantendo o padrão arquitetural do Hubly.
