
# Plano: Card maior, Atividades funcionais e Notificacao de convite

## 1. Layout da Home -- Card de IA maior

O card de IA atualmente ocupa 1 coluna (lg:col-span-1) num grid de 3 colunas. A mudanca faz ele ocupar as 3 colunas (largura total), e as secoes "Tarefas do Dia" e "Atividade Recente" ficam lado a lado abaixo dele em 2 colunas.

```text
+-------------------------------------------+
|         Card IA (largura total)            |
|   [Mic]  Conversar com IA                 |
|   [Via texto]  [Via voz]                   |
+-------------------------------------------+
| Tarefas do Dia       | Atividade Recente  |
|                      |                    |
+-------------------------------------------+
```

### Alteracoes em `src/pages/Home.tsx`:
- Card IA: `lg:col-span-3` com layout horizontal (flex-row) -- mic a esquerda, botoes a direita
- Tarefas e Atividades ficam num grid `lg:grid-cols-2` abaixo

## 2. Atividades Recentes funcionais com persistencia

### Banco de dados -- nova tabela `activity_logs`

Criar tabela com:
- `id` (uuid, PK)
- `user_id` (uuid) -- quem executou a acao
- `action` (text) -- tipo: `task_created`, `task_status_changed`, `task_assigned`, `member_invited`
- `entity_type` (text) -- `task`, `member`, etc.
- `entity_id` (text) -- ID da entidade
- `metadata` (jsonb) -- dados extras (titulo da tarefa, status antigo/novo, nome do membro, etc.)
- `created_at` (timestamptz)

RLS: usuarios autenticados podem ler todos os logs (visibilidade do time).

### Triggers no banco para popular automaticamente

1. **Criacao de tarefa** (`AFTER INSERT ON tasks`): insere log com `task_created`
2. **Mudanca de status** (`AFTER UPDATE ON tasks` quando `status` muda): insere log com `task_status_changed` incluindo status antigo e novo
3. **Atribuicao de responsavel** (`AFTER INSERT ON task_assignees`): insere log com `task_assigned`

### Realtime

Adicionar `activity_logs` ao `supabase_realtime` publication para atualizacao em tempo real.

### Hook `useActivityLogs`

Novo hook em `src/hooks/useActivityLogs.ts`:
- Query dos ultimos 30 logs ordenados por `created_at desc`
- Subscription realtime para invalidar cache quando novos logs chegam
- Join com tabela `members` para exibir nome/avatar do autor

### UI na Home

Substituir o placeholder de "Atividade Recente" por uma lista funcional com:
- Avatar e nome do membro que realizou a acao
- Descricao da acao (ex: "criou a tarefa TOZ-15", "moveu TOZ-12 para Em Progresso")
- Tempo relativo (ex: "ha 5 minutos")
- Icone por tipo de acao

## 3. Notificacao de convite de membro

### Alteracao na edge function `invite-member`

Apos o convite ser realizado com sucesso, inserir uma notificacao na tabela `notifications` para todos os admins informando que um novo membro foi convidado. Utiliza o `supabaseAdmin` (service role) que ja existe na funcao.

Notificacao criada:
- `type`: `member_invited`
- `title`: "Novo membro convidado"
- `body`: nome/email do membro convidado
- `link`: null

## Arquivos alterados

| Arquivo | Acao |
|---|---|
| `src/pages/Home.tsx` | Expandir card IA, integrar atividades funcionais |
| `src/hooks/useActivityLogs.ts` | Novo -- hook para buscar/subscrever logs de atividade |
| `supabase/functions/invite-member/index.ts` | Adicionar notificacao de convite |
| Migration SQL | Criar tabela `activity_logs`, triggers, realtime |
