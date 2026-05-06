# Graph Report - Hubly  (2026-05-05)

## Corpus Check
- 40 files · ~296,272 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 88 nodes · 73 edges · 33 communities (30 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `738d5c85`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]

## God Nodes (most connected - your core abstractions)
1. `SiteCard()` - 5 edges
2. `getDomain()` - 5 edges
3. `handler()` - 4 edges
4. `getCachedFavicon()` - 3 edges
5. `applyTheme()` - 3 edges
6. `isPrivateIP()` - 2 edges
7. `handler()` - 2 edges
8. `isPrivateIP()` - 2 edges
9. `extractIcons()` - 2 edges
10. `getBestIcon()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `SiteCard()` --calls--> `getDomain()`  [INFERRED]
  src/components/SiteCard.jsx → src/utils/favicon.js
- `SiteCard()` --calls--> `getCachedFavicon()`  [INFERRED]
  src/components/SiteCard.jsx → src/services/resolvedorFavicon.js

## Communities (33 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.29
Nodes (8): getAvatarColor(), getProxiedUrl(), SiteCard(), getCachedFavicon(), resolverFavicon(), setCachedFavicon(), getDomain(), getFaviconUrls()

### Community 1 - "Community 1"
Cohesion: 0.24
Nodes (5): decrypt(), encrypt(), carregarFaviconsDb(), deletarFaviconDb(), salvarFaviconDb()

### Community 2 - "Community 2"
Cohesion: 0.7
Nodes (4): extractIcons(), getBestIcon(), handler(), isPrivateIP()

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getDomain()` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `applyTheme()` connect `Community 4` to `Community 1`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `SiteCard()` (e.g. with `getDomain()` and `getCachedFavicon()`) actually correct?**
  _`SiteCard()` has 2 INFERRED edges - model-reasoned connections that need verification._