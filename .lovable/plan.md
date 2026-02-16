
# Plano de Implementacao - 4 Melhorias na Plataforma

## 1. Botao "Via texto" - Integrar Chatbot Toolzz Externo

Ao clicar em "Via texto" na Home, abrir um modal/dialog que carrega o widget de chat externo da Toolzz usando o script fornecido.

**Detalhes tecnicos:**
- Criar um componente `ToolzzChatDialog` que renderiza um Dialog/modal
- Dentro do modal, usar `useEffect` para injetar o script `https://chat-embed.toolzz.ai/dist/web.js` e chamar `Chatbot.initTzzaiWeb({ id: "92658cc0-7927-46f9-bce9-9972b6aae3d7" })`
- No `Home.tsx`, o botao "Via texto" abrira esse dialog
- O widget sera carregado dentro de um container no modal

## 2. Tarefas do Dia - Filtrar por data de entrega de hoje

Atualmente o filtro mostra tarefas com status `todo` ou `in_progress` sem considerar a data. Corrigir para mostrar tarefas cuja `delivery_date` corresponde ao dia de hoje.

**Detalhes tecnicos:**
- Em `Home.tsx`, alterar o filtro `todayTasks` para usar `isSameDay(parseISO(t.delivery_date), new Date())` do date-fns
- Manter o fallback: se nao houver tarefas com delivery_date de hoje, exibir a mensagem vazia

## 3. Atividade Recente - Rastrear acoes do usuario

Criar uma tabela `activity_logs` no banco de dados e registrar eventos como edicao de documentos, mudanca de status de tarefas, criacao de tarefas, etc.

**Detalhes tecnicos:**
- **Banco de dados:** Criar tabela `activity_logs` com colunas: `id`, `user_id`, `action` (ex: "task_created", "task_status_changed", "document_edited"), `entity_type`, `entity_id`, `entity_title`, `metadata` (JSONB), `created_at`. Habilitar RLS e realtime.
- **Trigger SQL:** Criar triggers em `tasks` (INSERT e UPDATE de status) e `documents`/`document_blocks` (UPDATE) para inserir registros automaticamente na tabela `activity_logs`
- **Hook `useActivityLogs`:** Buscar os ultimos 10 logs do usuario logado, com subscription realtime
- **Home.tsx:** Renderizar a lista de atividades com icones por tipo (tarefa criada, status alterado, documento editado) e timestamps relativos usando `formatDistanceToNow`

## 4. Busca Global (Command Palette)

Transformar o input de busca da TopBar em um Command Palette funcional usando o componente `cmdk` ja instalado. Ao clicar no input ou pressionar Cmd+K, abrir um dialog de busca global.

**Detalhes tecnicos:**
- Criar componente `SearchCommandDialog` usando `CommandDialog` do cmdk
- Buscar em tempo real: tarefas (tabela `tasks`), centrais/boards (tabela `boards`), integracoes (lista estatica)
- Agrupar resultados por categoria: "Tarefas", "Centrais", "Integracoes"
- Ao selecionar um item, navegar para a pagina correspondente (`/board` para tarefas/centrais, `/integrations` para integracoes)
- Em `TopBar.tsx`, substituir o input estatico por um botao que abre o `CommandDialog`
- Registrar atalho de teclado `Cmd+K` / `Ctrl+K` para abrir

## Sequencia de implementacao

1. Migracao SQL (tabela `activity_logs` + triggers)
2. `useActivityLogs` hook
3. `ToolzzChatDialog` componente
4. `SearchCommandDialog` componente
5. Atualizar `Home.tsx` (tarefas do dia + atividade recente + chatbot)
6. Atualizar `TopBar.tsx` (busca global)
