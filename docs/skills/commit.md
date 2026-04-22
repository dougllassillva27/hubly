---
name: commit
description: 'Garante commits ultra-comprimidos (padrão Caveman), protege a branch main/master e gera a atualização manual do histórico via Timestamp proativo.'
risk: safe
source: custom
date_added: '2026-04-20'
---

# Padrão de Commits Caveman e Histórico GSD

Antes de gerar a mensagem de commit final, você DEVE garantir a precisão cronológica da memória operacional e seguir as regras de compressão extrema do padrão Caveman.

### Fase 1: Verificação de Branch (Pré-requisito)

Antes de commitar, SEMPRE verifique a branch atual. Se você estiver na branch `main` ou `master`, você DEVE parar e solicitar que o usuário crie uma feature branch primeiro (ou usar a skill create-branch, se disponível), a menos que o usuário tenha pedido explicitamente para commitar na main.

### Fase 2: Captura do Timestamp e Histórico (MÉTODO MANUAL)

O usuário enviará a data e hora atual diretamente no prompt de invocação desta skill (ex: `Timestamp: 20/04/2026 17:15`). Extraia este valor exato.

Você está **PROIBIDO** de usar ferramentas de edição para escrever no arquivo `@resumo-de-trabalho.md` diretamente. Em vez disso, **gere o texto de atualização em um bloco de código markdown no chat**, para o usuário fazer o copy-paste.

O texto do histórico DEVE ser ultra-comprimido, seguindo a estrutura: `[Tarefa/Problema] -> [Ação] -> [Motivo] (Use [Tarefa] para features/setups e [Problema] para correções de bugs)`.

### Fase 3: Caveman Commit Messages

Escreva a mensagem de commit de forma ríspida e exata. Sem enrolação. Foque no _porquê_ (why), não no _o que_ (what).

**Regras do Assunto (Subject):**

- Formato: `<tipo>(<escopo>): <resumo imperativo>`
- Tipos: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `style`.
- Modo imperativo ("adiciona", "corrige" — nunca "adicionado", "adicionando").
- Máximo de 50 caracteres (limite rígido 72). Sem ponto final.

**Regras do Corpo (Body):**

- **Omita inteiramente** se o assunto for autoexplicativo.
- Adicione APENAS para explicar o _porquê_ não óbvio, breaking changes ou notas de migração.
- **PROIBIDO usar:** "Este commit...", "Eu", "Nós", "Agora", "Atualmente" (o diff já mostra o que mudou).

### Exemplo de Saída Final no Chat:

Copie o bloco abaixo e adicione ao final do seu arquivo `@resumo-de-trabalho.md`:

```text
[20/04/2026 17:15] - [Problema] Token não expirava. [Ação] Validação ajustada para <=. [Motivo] Previne uso de tokens no limite exato.
[20/04/2026 17:20] - [Tarefa] Configuração do Netlify. [Ação] Arquivo _redirects criado. [Motivo] Prevenir erros 404 no roteamento da SPA.
Mensagem de commit sugerida:
fix(auth): ajusta limite de expiracao de token

Previne caso extremo onde token era aceito no milissegundo exato da expiracao.

```
