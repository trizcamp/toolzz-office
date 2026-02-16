
# Relatório Funcional em Tempo Real e Poker de Votação

## Visao Geral

Tres grandes blocos de trabalho:

1. **Relatorio funcional** com dados reais do banco (remover custo da feature, calcular metricas de performance real)
2. **Poker funcional** com votacao persistida no banco, exibicao de votos por membro, e documentacao apenas visualizavel
3. Hook de votos (`useTaskVotes`) para CRUD na tabela `task_votes`

---

## 1. Relatorio (`BoardReport.tsx`)

### Remover
- Secao inteira "Custo da Feature" (linhas 62-67 e 118-130)
- Mock data `performanceData` (linhas 19-25)
- Mock `weeklyData` (linhas 48-53)
- Lead Time Medio hardcoded "4.2d"

### Novas props
O componente recebera `boardId` para buscar assignees e membros do board.

### Metricas reais (cards superiores)
- **Total**: `tasks.length`
- **Concluidas**: tarefas com `status === "done"`
- **Em Progresso**: tarefas com `status === "in_progress"`
- **Lead Time Medio**: calculado a partir de tarefas "done" usando `(updated_at - created_at)` em dias, media arredondada

### Grafico "Concluidas por Semana"
- Agrupar tarefas com `status === "done"` pela semana do `updated_at` (momento em que foi marcada como done)
- Mostrar as ultimas 4 semanas

### Performance da Equipe (dados reais)
- Buscar `task_assignees` com join em `members` e `tasks` para o board atual
- Para cada membro vinculado ao board:
  - **Entregues**: count de tarefas "done" atribuidas ao membro
  - **No Prazo**: tarefas "done" onde `updated_at <= delivery_date` (ou sem delivery_date conta como no prazo)
  - **Atrasos**: tarefas "done" onde `updated_at > delivery_date`
  - **Desgaste**: calculado por ratio de atrasos (0 = Baixo, ate 30% = Medio, acima = Alto)

---

## 2. Poker Funcional (`PriorityPokerCard.tsx`)

### Hook `useTaskVotes`
Novo hook em `src/hooks/useTaskVotes.ts`:
- `useTaskVotes(boardId)` - busca todos os votos das tarefas do board
- `castVote(taskId, points)` - insere/atualiza voto do usuario logado via upsert
- Realtime via subscription na tabela `task_votes`

### Alteracoes no `PriorityPokerCard`
- Receber `votes` (do hook) e `onVote(taskId, points)` como props
- Ao clicar em um numero fibonacci, chamar `onVote` que persiste no banco
- Destacar o botao do ponto que o usuario atual votou
- Exibir lista de votos com avatar/inicial e pontos de cada membro
- Calcular media dos pontos automaticamente
- Documentacao aberta ao clicar na tarefa sera **read-only** (sem `onChange` no `BlockEditor`)

### Alteracoes no `BoardPage.tsx`
- Importar e usar `useTaskVotes` na tab Poker
- Passar `mappedTasks` com votos reais mesclados
- Ao selecionar tarefa no Poker, abrir `TaskDetailPanel` em modo read-only para documentacao

---

## 3. Documentacao Read-Only no Poker

Quando a tarefa for aberta a partir da tab Poker:
- O `TaskDetailPanel` recebera uma prop `readOnly?: boolean`
- Quando `readOnly=true`: inputs de titulo/status/prioridade ficam desabilitados, `BlockEditor` nao recebe `onChange`
- O usuario pode visualizar toda a documentacao mas nao editar

---

## Detalhes Tecnicos

### Novo arquivo: `src/hooks/useTaskVotes.ts`
```typescript
// Busca votos de todas as tarefas de um board
// castVote faz upsert (user_id + task_id unique)
// Realtime subscription em task_votes
```

### `BoardReport.tsx` - Mudancas
- Props: `tasks` + `boardId`
- Queries internas: buscar `task_assignees` com join `members` e `tasks` para calcular performance
- Calcular lead time real: `differenceInDays(updated_at, created_at)` para tarefas done
- Agrupar tarefas done por semana usando `date-fns`
- Remover toda secao de custo

### `PriorityPokerCard.tsx` - Mudancas
- Props adicionais: `votes`, `currentUserId`, `onVote`
- Fibonacci buttons executam `onVote(task._dbId, points)`
- Exibir votos reais com nome/avatar de cada membro

### `TaskDetailPanel.tsx` - Mudancas
- Nova prop `readOnly?: boolean`
- Quando true: desabilitar inputs, nao passar `onChange` ao BlockEditor

### `BoardPage.tsx` - Mudancas
- Instanciar `useTaskVotes(selectedBoard)`
- Mesclar votos nos `mappedTasks` para a tab Poker
- Passar `readOnly={true}` ao `TaskDetailPanel` quando aberto via Poker
- Passar `boardId` ao `BoardReport`

### Tabela `task_votes`
Ja existe no banco com colunas: `id`, `task_id`, `user_id`, `points`, `created_at`. Nao precisa de migration. Precisa apenas garantir constraint unique em `(task_id, user_id)` para upsert funcionar - isso sera feito via migration se necessario.
