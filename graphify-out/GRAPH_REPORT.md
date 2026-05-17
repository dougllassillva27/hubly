# Graph Report - Hubly  (2026-05-17)

## Corpus Check
- 51 files · ~291,032 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 112 nodes · 97 edges · 41 communities (37 shown, 4 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4578c95d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]

## God Nodes (most connected - your core abstractions)
1. `SiteCard()` - 7 edges
2. `isLocalDomain()` - 6 edges
3. `getDomain()` - 5 edges
4. `handler()` - 4 edges
5. `getProxiedUrl()` - 4 edges
6. `useJogosHoje()` - 3 edges
7. `useNoticiasFutebol()` - 3 edges
8. `getCachedFavicon()` - 3 edges
9. `applyTheme()` - 3 edges
10. `getFaviconUrls()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `SiteCard()` --calls--> `getDomain()`  [INFERRED]
  src/components/SiteCard.jsx → src/utils/favicon.js
- `SiteCard()` --calls--> `isLocalDomain()`  [INFERRED]
  src/components/SiteCard.jsx → src/utils/favicon.js
- `SiteCard()` --calls--> `getCachedFavicon()`  [INFERRED]
  src/components/SiteCard.jsx → src/services/resolvedorFavicon.js
- `SiteCard()` --calls--> `getProxiedUrl()`  [INFERRED]
  src/components/SiteCard.jsx → src/utils/favicon.js
- `JogosHoje()` --calls--> `useJogosHoje()`  [INFERRED]
  src/components/futebol/JogosHoje.jsx → src/hooks/useJogosHoje.js

## Communities (41 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.31
Nodes (10): getAvatarColor(), getProxiedUrl(), SiteCard(), getCachedFavicon(), resolverFavicon(), setCachedFavicon(), getDomain(), getFaviconUrls() (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (6): applyTheme(), decrypt(), encrypt(), carregarFaviconsDb(), deletarFaviconDb(), salvarFaviconDb()

### Community 2 - "Community 2"
Cohesion: 0.7
Nodes (4): extractIcons(), getBestIcon(), handler(), isPrivateIP()

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getDomain()` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `SiteCard()` (e.g. with `getDomain()` and `isLocalDomain()`) actually correct?**
  _`SiteCard()` has 4 INFERRED edges - model-reasoned connections that need verification._