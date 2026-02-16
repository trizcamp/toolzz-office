

# Backend Completo com Arquitetura Orientada a Eventos

Migrar toda a plataforma Toolzz Office de dados mockados para um backend funcional usando Lovable Cloud (Supabase), com eventos que conectam os modulos automaticamente.

---

## Visao Geral da Arquitetura

```text
+-----------+     Supabase Realtime     +------------------+
|  Frontend | <-----------------------> | Supabase Database |
|  (React)  |                           +--------+---------+
|           |      invoke()                      |
|           | -----------------> Edge Functions  |
+-----------+                    |               |
                                 | DB Webhooks / |
                                 | Triggers      |
                                 v               |
                          +------+------+        |
                          | Event Bus   | -------+
                          | (pg_notify) |
                          +------+------+
                                 |
                    +------------+------------+
                    |            |            |
              task.created  meeting.saved  message.sent
                    |            |            |
              Auto-gera doc  Extrai tasks  Broadcast
              via Edge Fn    via IA         Realtime
```

---

## 1. Schema do Banco de Dados

### 1.1 Tabelas Principais

**`boards`** - Centrais de tarefas
- id (uuid, PK), name, description, sector, icon, created_by, created_at, updated_at

**`tasks`** - Tarefas
- id (uuid, PK), display_id (text, "TOZ-101"), board_id (FK boards), title, description, status (enum), priority (enum), type, points, delivery_date, parent_id (self FK), created_by, created_at, updated_at

**`task_assignees`** - Relacao N:N tarefas-membros
- id, task_id (FK), user_id (FK), created_at

**`task_votes`** - Votos do Priority Poker
- id, task_id (FK), user_id (FK), points, created_at

**`documents`** - Documentos
- id (uuid, PK), title, icon, type (doc/spec/note), task_id (FK tasks, nullable), created_by, created_at, updated_at

**`document_blocks`** - Blocos do editor
- id, document_id (FK), type (enum), content (text), position (int), checked (bool), metadata (jsonb), created_at, updated_at

**`document_comments`** - Comentarios
- id, document_id (FK), user_id (FK), text, created_at

**`rooms`** - Salas do escritorio
- id (uuid, PK), name, category, type (voice/text/hybrid), created_by, created_at

**`messages`** - Mensagens do chat
- id (uuid, PK), room_id (FK rooms), user_id (FK), text, created_at

**`meetings`** - Reunioes salvas
- id, title, room_id (FK), date, start_time, end_time, summary, created_by, created_at

**`meeting_participants`** - Participantes
- id, meeting_id (FK), user_id (FK)

**`meeting_transcripts`** - Transcricao
- id, meeting_id (FK), speaker_id (FK), text, timestamp, created_at

**`meeting_tasks`** - Tarefas geradas pela reuniao
- id, meeting_id (FK), task_id (FK)

**`members`** - Perfis dos membros
- id (uuid, PK, FK auth.users), name, surname, email, phone, avatar_url, language, created_at, updated_at

**`user_roles`** - Papeis (tabela separada por seguranca)
- id, user_id (FK auth.users), role (enum: admin/member)

**`type_definitions`** - Tipos customizaveis de tarefas
- id, board_id (FK), name, color_classes, created_at

### 1.2 Enums

```text
task_status: backlog, todo, in_progress, review, done
task_priority: critical, high, medium, low
room_type: voice, text, hybrid
doc_type: doc, spec, note
app_role: admin, member
block_type: paragraph, heading1, heading2, heading3, bulletList, numberedList, todoList, code, quote, callout, divider, toggle, image
```

### 1.3 RLS (Row Level Security)

- Todas as tabelas com RLS habilitado
- Politicas baseadas em `auth.uid()` para leitura e escrita
- Funcao `has_role()` security definer para checar admin
- Membros podem ler tudo do workspace; apenas admins podem deletar/gerenciar membros

---

## 2. Edge Functions (Eventos)

### 2.1 `task-created` - Evento: Nova Tarefa

Quando uma tarefa e criada, automaticamente gera um documento associado com template de backlog.

```text
Frontend cria task -> INSERT tasks
                   -> Edge function "task-created"
                      -> INSERT documents (titulo = "Backlog: {task.title}")
                      -> INSERT document_blocks (template padrao)
                      -> UPDATE tasks SET document_id
```

**Trigger:** Chamado pelo frontend apos INSERT na tabela tasks (via `supabase.functions.invoke`).

### 2.2 `ai-analyze-meeting` - Evento: Reuniao Finalizada

Recebe a transcricao, envia para Lovable AI (GPT) para:
1. Gerar resumo da reuniao
2. Identificar tarefas mencionadas
3. Criar tarefas automaticamente com documentos

```text
Frontend envia transcricao -> Edge function "ai-analyze-meeting"
   -> Lovable AI Gateway (google/gemini-3-flash-preview)
      -> Tool calling: extract_tasks, generate_summary
   -> INSERT tasks (para cada tarefa identificada)
   -> Chama "task-created" para gerar documentos
   -> UPDATE meetings SET summary
   -> Response com resumo + tarefas criadas
```

### 2.3 `ai-chat` - Assistente de IA para Tarefas

Chat com IA que pode criar tarefas durante a conversa. Usa tool calling para detectar intencao de criar tarefa.

```text
Frontend envia mensagem -> Edge function "ai-chat"
   -> Lovable AI Gateway com tools:
      - create_task(title, description, priority, status)
   -> Se tool_call detectado:
      -> INSERT tasks
      -> Chama logica de "task-created" (gera documento)
   -> Response com mensagem + tarefas criadas (se houver)
```

### 2.4 `manage-members` - Gerenciamento de Membros

Endpoint para convidar, remover e alterar roles de membros.

---

## 3. Supabase Realtime

### 3.1 Chat em Tempo Real

- Subscribe no canal `messages:room_id={id}` para receber novas mensagens
- INSERT na tabela `messages` dispara broadcast automatico via Realtime
- Componente `ChatArea` usa `useEffect` com `supabase.channel()` para escutar

### 3.2 Presenca Online

- Usar Supabase Realtime Presence para rastrear usuarios online por sala
- `channel.track({ user_id, user_name, room_id })` ao entrar na sala
- `channel.on('presence', ...)` para atualizar lista de usuarios conectados
- Substitui o conceito de Redis para presenca

### 3.3 Atualizacoes em Tempo Real

- Tabela `tasks`: subscribe para atualizacoes (drag-and-drop no Kanban sincronizado)
- Tabela `documents`: subscribe para edicoes colaborativas basicas
- Tabela `rooms`: subscribe para novas salas criadas/deletadas

---

## 4. Fluxo de Eventos Detalhado

### Evento: Criar Tarefa (Manual ou IA)

```text
1. Usuario preenche formulario OU IA detecta tarefa
2. Frontend chama supabase.from("tasks").insert(...)
3. Frontend chama edge function "task-created" com task_id
4. Edge function cria documento com blocos de template:
   - Heading: titulo da tarefa
   - Paragrafo: descricao/objetivo
   - Heading2: "Criterios de Aceite"
   - TodoList: items vazios para preencher
   - Divider
   - Heading2: "Notas Tecnicas"
   - Paragrafo vazio
5. Retorna document_id
6. Frontend recebe confirmacao
7. Realtime notifica outros usuarios da nova tarefa
```

### Evento: Habilitar IA na Reuniao

```text
1. Usuario clica "Habilitar IA" na sala de voz
2. Frontend comeca a gravar audio (MediaRecorder API)
3. A cada N segundos, envia chunk para transcricao local
   (Web Speech API como fallback, ou acumula para enviar no final)
4. Ao clicar "Parar IA":
   - Frontend envia transcricao completa para "ai-analyze-meeting"
   - Edge function processa com Lovable AI
   - Retorna: summary + array de tarefas extraidas
   - Frontend salva meeting + cria tarefas via "task-created"
5. Reuniao aparece no modulo Reunioes com transcricao e tarefas
```

### Evento: Chat com IA para Criar Tarefa

```text
1. Usuario escolhe "Assistencia de IA" no dialog de nova tarefa
2. Abre interface de chat com a IA (modo texto)
3. Usuario descreve o que precisa
4. Edge function "ai-chat" processa com tool calling
5. Se IA identifica tarefa:
   - Chama tool create_task com dados extraidos
   - Insere no banco + gera documento
   - Responde: "Criei a tarefa TOZ-115: {titulo}"
6. Usuario pode continuar conversando para refinar
```

---

## 5. Mudancas no Frontend

### 5.1 Camada de Dados (Hooks)

Criar hooks React Query para cada entidade:

- `useBoards()` - CRUD de centrais
- `useTasks(boardId)` - CRUD de tarefas com filtros
- `useDocuments()` - CRUD de documentos
- `useDocument(id)` - Documento com blocos
- `useRooms()` - CRUD de salas
- `useMessages(roomId)` - Mensagens com Realtime
- `usePresence(roomId)` - Presenca online
- `useMeetings()` - Historico de reunioes
- `useMembers()` - Lista de membros

### 5.2 Integracao Supabase

- Criar `src/integrations/supabase/client.ts` (auto-gerado pelo Lovable Cloud)
- Remover todos os arquivos `src/data/mock*.ts`
- Substituir `useState(mockData)` por hooks React Query

### 5.3 Componentes Modificados

| Componente | Mudanca |
|---|---|
| `BoardPage.tsx` | React Query para boards/tasks, mutations com invalidacao |
| `OfficePage.tsx` | Realtime messages, presence tracking |
| `ChatArea.tsx` | Subscribe Realtime, INSERT messages |
| `VoiceParticipants.tsx` | MediaRecorder + transcricao, evento ai-analyze-meeting |
| `MeetingsPage.tsx` | React Query para meetings |
| `DocumentsPage.tsx` | React Query para documents |
| `BlockEditor.tsx` | Salvar blocos no banco |
| `NewTaskDialog.tsx` | INSERT task + chamar task-created, chat IA funcional |
| `SettingsDialog.tsx` | React Query para members, edge function manage-members |
| `RoomList/RoomItem` | CRUD rooms no banco |
| `MemberList.tsx` | Presence API do Supabase Realtime |

---

## 6. Arquivos Novos

```text
-- Migracao SQL
supabase/migrations/001_initial_schema.sql

-- Edge Functions
supabase/functions/task-created/index.ts
supabase/functions/ai-analyze-meeting/index.ts
supabase/functions/ai-chat/index.ts
supabase/functions/manage-members/index.ts

-- Config
supabase/config.toml (atualizar com novas functions)

-- Hooks
src/hooks/useBoards.ts
src/hooks/useTasks.ts
src/hooks/useDocuments.ts
src/hooks/useMessages.ts
src/hooks/usePresence.ts
src/hooks/useMeetings.ts
src/hooks/useMembers.ts
src/hooks/useRooms.ts
```

---

## 7. Ordem de Implementacao

1. **Habilitar Lovable Cloud** e Lovable AI
2. **Schema SQL** - Criar todas as tabelas, enums, RLS, funcoes
3. **Seed data** - Inserir dados iniciais (membros, boards, rooms)
4. **Hooks React Query** - Camada de dados
5. **Edge Functions** - task-created, ai-chat, ai-analyze-meeting
6. **Migrar componentes** - Substituir mock por dados reais
7. **Realtime** - Chat + presenca
8. **IA** - Chat assistente + analise de reunioes

