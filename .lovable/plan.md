

# Evolucao Completa da Plataforma Toolzz Office

Este plano cobre todas as alteracoes solicitadas, divididas em blocos logicos. Dada a magnitude das mudancas, a implementacao sera feita em etapas priorizadas.

---

## 1. Alteracoes Gerais de Tema e Layout

### 1.1 Background e Botoes

**Arquivo:** `src/index.css`
- Alterar `--background` de `0 0% 7%` para `0 0% 8%` (equivalente a #141414)
- Ajustar `--sidebar-background` para `0 0% 6%` (ligeiramente mais escuro)
- Fonte Inter ja esta configurada -- sem alteracoes necessarias
- Adicionar classe utilitaria `.btn-gradient` para botoes com gradiente cinza claro premium:
  ```
  background: linear-gradient(135deg, #2a2a2a, #3a3a3a);
  border: 1px solid rgba(255,255,255,0.08);
  ```

### 1.2 Menu Lateral

**Arquivo:** `src/components/AppSidebar.tsx`
- Remover itens "Relatorios" e "Equipe" do array `navItems`
- Adicionar item "Integracoes" com icone `Puzzle` apontando para `/integrations`
- Adicionar item "Calendario" com icone `Calendar` apontando para `/calendar`
- Mover `VoiceConnectionBar` para dentro da sidebar, posicionado acima do botao "Recolher", dentro do mesmo componente

### 1.3 VoiceConnectionBar no Sidebar

**Arquivo:** `src/components/AppSidebar.tsx`
- Importar e renderizar `VoiceConnectionBar` entre a navegacao e o botao "Recolher"
- Quando sidebar estiver colapsada, mostrar versao compacta (apenas icones de mic/audio/disconnect)
- Quando expandida, mostrar nome da sala + controles completos

**Arquivo:** `src/components/AppLayout.tsx`
- Remover `VoiceConnectionBar` do bottom do layout principal (ja esta no sidebar agora)

**Arquivo:** `src/components/VoiceConnectionBar.tsx`
- Refatorar para aceitar prop `collapsed` e renderizar versao compacta ou expandida
- Layout vertical quando no sidebar em vez de horizontal

### 1.4 Rotas

**Arquivo:** `src/App.tsx`
- Remover rotas `/reports` e `/team`
- Adicionar rotas: `/integrations`, `/calendar`
- Importar novos componentes de pagina

---

## 2. Home -- Visao Geral do Usuario

**Arquivo:** `src/pages/Home.tsx` (reescrever)

Layout em grid com:
- **Saudacao** no topo: "Bom dia, Boss" com data atual
- **Card "Conversar com IA"**: botao de microfone pulsante para iniciar conversa por voz ou texto (reutilizar conceito existente)
- **Card "Tarefas do Dia"**: lista compacta de tarefas com status `todo` ou `in_progress` filtradas do mockTasks, com titulo, prioridade e responsavel
- **Card "Reunioes do Dia"**: lista das reunioes agendadas para hoje (mockadas), com horario, sala e participantes
- **Card "Atividade Recente"**: ultimas acoes na plataforma (mockadas)

Design: cards com borda sutil, fundo `card`, espaçamento generoso

---

## 3. Modulo Esteira -- Melhorias

### 3.1 Nova Tarefa -- Fluxo de Criacao

**Arquivo:** `src/pages/BoardPage.tsx`
- Ao clicar "Nova Tarefa", abrir dialog com 3 opcoes:
  1. **Manual** -- abre formulario completo
  2. **Template** -- badge "Em breve" desabilitado
  3. **Assistencia de IA** -- abre sub-dialog com opcao "Agente de Voz" ou "Agente de Texto"

**Novo arquivo:** `src/components/board/NewTaskDialog.tsx`
- Dialog com selecao de modo (cards estilo imagem-11: "Criar em branco", "Criar com template", "Assistencia IA")
- Modo Manual: formulario com campos:
  - Nome da tarefa (input)
  - Objetivo (textarea)
  - Etapa/Status (select: backlog, todo, etc.)
  - Responsavel/Cargo (select de assignees)
  - Data de entrega (date picker)
  - Repositorio GitHub (select, desabilitado se nao tiver integracao)
  - Parent task / Subtask (select opcional de tarefas existentes)

### 3.2 Drag and Drop nos Cards Kanban

**Arquivo:** `src/components/board/KanbanColumn.tsx` e `src/components/board/TaskCard.tsx`
- Implementar HTML5 Drag and Drop nativo
- TaskCard: `draggable`, `onDragStart` definindo `dataTransfer` com task id
- KanbanColumn: `onDragOver` (preventDefault), `onDrop` para mover tarefa
- Visual feedback durante drag (opacidade reduzida no card original, indicador de drop zone)

### 3.3 Detalhe do Card -- Painel Lateral

**Novo arquivo:** `src/components/board/TaskDetailPanel.tsx`
- Ao clicar em um card (kanban ou lista), abre painel lateral direito (similar ao meeting detail)
- Exibe: titulo editavel, status (select), prioridade (select), tipo (select), responsavel (select), data, repositorio
- Abaixo: documento da tarefa em modo Notion (usando o editor de blocos)
- Documento expansivel (botao minimizar/maximizar)

### 3.4 Renomear aba "Prioridade" para "Poker"

**Arquivo:** `src/pages/BoardPage.tsx`
- Trocar TabsTrigger de "Prioridade" para "Poker"

### 3.5 Poker -- Melhorias

**Arquivo:** `src/components/board/PriorityPokerCard.tsx`
- Adicionar botao para apagar tarefa do poker
- Permitir editar titulo e descricao inline
- Ao clicar na tarefa, abrir o mesmo painel de documentacao (TaskDetailPanel)

---

## 4. Modulo Escritorio -- Melhorias

### 4.1 Toggle IA On/Off

**Arquivo:** `src/components/office/VoiceParticipants.tsx`
- Botao "Habilitar IA" agora funciona como toggle
- Quando ativo: mudar para "Parar IA" com feedback
- Ao desabilitar: exibir toast "Reuniao salva em 'Reunioes'" e registrar no mock

### 4.2 Edicao de Nome de Canal

**Arquivo:** `src/components/office/RoomItem.tsx`
- Ja existe botao de Settings que abre RoomFormDialog para edicao -- funcionalidade existente
- Garantir que o nome seja o campo principal editavel

### 4.3 Barra de Ligacao Dentro do Escritorio

**Arquivo:** `src/pages/OfficePage.tsx`
- Quando dentro do modulo escritorio e conectado a uma sala de voz, exibir controles de audio (mic, deafen, disconnect) logo abaixo do grid de participantes na area central (nao na sidebar)
- Isso e adicional ao VoiceConnectionBar do sidebar -- sao complementares

---

## 5. Modulo Integracoes

**Novo arquivo:** `src/pages/IntegrationsPage.tsx`

Layout inspirado na imagem-8:
- Titulo "Integracoes" + subtitulo "Conecte suas ferramentas favoritas"
- Grid de cards (3 colunas):
  - **GitHub**: icone, descricao "Conecte e sincronize seus repositorios", botao "Configurar"
  - **GitLab**: icone, descricao, badge "Em breve"
  - **Slack**: icone, descricao, badge "Em breve"
  - **Figma**: icone, descricao, badge "Em breve"

Ao clicar em "Configurar" no GitHub:
- Navegar para sub-view (ou alterar estado) mostrando:
  - Header com "< Voltar para integracoes"
  - Card GitHub com descricao
  - Botao "Conectar" que simula redirecionamento (abre `https://github.com` em nova aba)

---

## 6. Modulo Calendario

**Novo arquivo:** `src/pages/CalendarPage.tsx`

Calendario mensal estilo Google Calendar:
- Grid de 7 colunas (dias da semana) x ~5 linhas (semanas)
- Cada celula mostra o dia e eventos (tarefas e reunioes) como badges coloridos
- Dados puxados do `mockTasks` (data de entrega) e `mockMeetings` (data da reuniao)
- Navegacao mes anterior/proximo
- Ao clicar em um evento, mostrar tooltip com detalhes
- Usar a lib `date-fns` (ja instalada) para calculos de data

---

## 7. Modulo Documentos -- Editor Notion-Like

Este e o modulo mais complexo. Sera construido com estado local e contentEditable.

### 7.1 Estrutura de Dados

**Novo arquivo:** `src/data/mockDocuments.ts`
- Tipos: `Document`, `Block`
- Block: `{ id, type, content, children, metadata }`
- Tipos de bloco: paragraph, heading1, heading2, heading3, bulletList, numberedList, todoList, code, quote, callout, divider, toggle, image, table
- Documentos mockados (2-3 docs de exemplo vinculados a tarefas)

### 7.2 Pagina de Listagem

**Novo arquivo:** `src/pages/DocumentsPage.tsx`
- Layout com sidebar esquerda (lista de docs) + area principal
- Sidebar:
  - Botao "Nova pagina"
  - Lista de documentos agrupados (Workspace, Shared, Private)
  - Cada item: nome do doc, tarefa vinculada (se houver)
- Ao clicar em um doc, abrir editor na area principal

### 7.3 Editor de Blocos

**Novo arquivo:** `src/components/documents/BlockEditor.tsx`
- Editor principal baseado em blocos
- Cada bloco e um componente `BlockItem` com `contentEditable`
- Funcionalidades MVP:
  - Criar novo bloco ao pressionar Enter
  - Remover bloco vazio com Backspace
  - Menu "/" para inserir tipos de bloco (slash command)
  - Formatacao inline: negrito (Ctrl+B), italico (Ctrl+I), sublinhado (Ctrl+U)
  - Atalhos markdown: `#` para titulo, `*` para lista, `1.` para numerada, `>` para citacao, ``` para codigo
  - Drag and drop de blocos (reordenacao)

**Novo arquivo:** `src/components/documents/BlockItem.tsx`
- Renderiza um bloco individual baseado no tipo
- Handle de drag (6 pontos a esquerda)
- Menu de contexto (duplicar, deletar, transformar tipo)

**Novo arquivo:** `src/components/documents/SlashCommandMenu.tsx`
- Menu dropdown que aparece ao digitar "/"
- Lista de tipos de bloco com icones
- Filtro por digitacao

**Novo arquivo:** `src/components/documents/EditorToolbar.tsx`
- Barra de ferramentas no topo (similar a imagem-10)
- Selecao de tipo de texto, negrito, italico, sublinhado, riscado
- Alinhamento, listas, codigo, tabela, imagem

### 7.4 Componentes de Bloco Especificos

**Novo arquivo:** `src/components/documents/blocks/CodeBlock.tsx`
- Bloco de codigo com selecao de linguagem
- Syntax highlighting basico com CSS

**Novo arquivo:** `src/components/documents/blocks/TodoBlock.tsx`
- Checkbox + texto editavel

**Novo arquivo:** `src/components/documents/blocks/ToggleBlock.tsx`
- Conteudo expansivel/colapsavel

**Novo arquivo:** `src/components/documents/blocks/CalloutBlock.tsx`
- Bloco destacado com icone e fundo colorido

### 7.5 Comentarios

- Aba lateral de comentarios no documento
- Cada comentario: autor, timestamp, texto
- Dados mockados

---

## 8. Reutilizacao do Editor Notion nos Outros Modulos

O editor de blocos sera um componente reutilizavel (`BlockEditor`) usado em:
- **TaskDetailPanel** (esteira): documento da tarefa
- **MeetingsPage**: transcricao formatada no painel lateral
- **DocumentsPage**: editor principal

---

## Resumo de Novos Arquivos

```text
src/pages/IntegrationsPage.tsx
src/pages/CalendarPage.tsx
src/pages/DocumentsPage.tsx
src/components/board/NewTaskDialog.tsx
src/components/board/TaskDetailPanel.tsx
src/components/documents/BlockEditor.tsx
src/components/documents/BlockItem.tsx
src/components/documents/SlashCommandMenu.tsx
src/components/documents/EditorToolbar.tsx
src/components/documents/blocks/CodeBlock.tsx
src/components/documents/blocks/TodoBlock.tsx
src/components/documents/blocks/ToggleBlock.tsx
src/components/documents/blocks/CalloutBlock.tsx
src/data/mockDocuments.ts
```

## Arquivos Modificados

```text
src/index.css                          -- background #141414, classe btn-gradient
src/components/AppSidebar.tsx          -- remover itens, adicionar novos, integrar VoiceConnectionBar
src/components/AppLayout.tsx           -- remover VoiceConnectionBar do bottom
src/components/VoiceConnectionBar.tsx  -- refatorar para sidebar (vertical, prop collapsed)
src/App.tsx                            -- novas rotas, remover antigas
src/pages/Home.tsx                     -- reescrever com visao geral
src/pages/BoardPage.tsx                -- novo dialog, drag-and-drop, painel lateral, renomear aba
src/pages/OfficePage.tsx               -- controles de audio inline
src/components/office/VoiceParticipants.tsx -- toggle IA on/off
src/components/board/KanbanColumn.tsx  -- suporte drag-and-drop
src/components/board/TaskCard.tsx      -- draggable
src/components/board/PriorityPokerCard.tsx -- delete, edit, click-to-detail
src/data/mockTasks.ts                  -- adicionar campo parentId, deliveryDate
```

## Ordem de Implementacao

1. Tema e layout (CSS, sidebar, rotas)
2. Home com visao geral
3. Integracoes (pagina simples)
4. Calendario
5. Esteira (drag-drop, novo dialog, painel lateral)
6. Escritorio (toggle IA, controles inline)
7. Documentos (editor Notion-like -- componente mais complexo)

