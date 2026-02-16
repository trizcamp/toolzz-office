# Evolucao da Plataforma Toolzz Office

Tres modulos serao criados/reformulados: Escritorio, Reunioes e Esteira. Alem disso, a secao de Workspaces sera removida da sidebar principal.

---

## 1. Remover Workspaces da Sidebar

**Arquivo:** `src/components/AppSidebar.tsx`

- Remover o array `workspaces` e toda a secao visual entre o logo e a navegacao (linhas 65-119)
- Remover importacao do icone `Plus` (se nao usado em outro lugar)
- A navegacao sobe diretamente abaixo do logo

---

## 2. Modulo Escritorio -- Melhorias

### 2.1 Edicao e criacao de canais

**Arquivo:** `src/components/office/RoomList.tsx`

- Adicionar botao "+" no header para criar novo canal
- Ao clicar, abrir um dialog/modal com campos: nome, categoria (select), tipo (voz/texto/hibrido)
- Ao lado de cada canal, exibir icone de edicao (visivel no hover) que abre o mesmo modal em modo de edicao
- Estado dos canais sera gerenciado localmente com `useState` inicializado com `mockRooms`

**Novo arquivo:** `src/components/office/RoomFormDialog.tsx`

- Dialog reutilizavel para criar e editar canal
- Campos: Nome (input), Categoria (select), Tipo (radio group com icones)

### 2.2 Flag de canal conectado

**Arquivo:** `src/components/office/RoomItem.tsx`

- Adicionar indicador visual (ponto verde pulsante) quando o usuario esta conectado naquele canal especifico
- Verificar comparando `room.id` com `connectedRoom?.id` do contexto

### 2.3 Membros minimizados e expansao em sala de voz

**Arquivo:** `src/pages/OfficePage.tsx` e `src/components/office/MemberList.tsx`

- Remover `MemberList` como coluna fixa sempre visivel deixar de forma que usuário possa recolher e encolher a visualização dos membros
- Quando uma sala de voz/hibrida estiver selecionada:
  - Exibir lista de participantes expandida dentro da area central, acima do chat
  - Mostrar avatares, nomes, indicador de "falando"
  - Adicionar botao "Habilitar IA na reuniao" com badge informando que a IA fara a transcricao da chamada
- Quando sala de texto: area central mostra apenas o chat, sem lista de participantes

**Arquivo:** `src/components/office/VoiceParticipants.tsx` (novo)

- Componente que exibe participantes da chamada de voz em grid/lista
- Botao "Habilitar IA na reuniao" com tooltip explicativo
- Indicador visual de quem esta falando (ring verde pulsante)

### 2.4 Participantes no canal de voz (sidebar)

**Arquivo:** `src/components/office/RoomItem.tsx`

- Quando a sala e de voz e tem usuarios conectados, exibir abaixo do nome do canal uma lista compacta dos avatares/nomes dos participantes (similar ao Discord)

---

## 3. Modulo Reunioes

**Novo arquivo:** `src/pages/MeetingsPage.tsx`

Layout com abas (Tabs):

### Aba "Historico"

- Listagem de reunioes transcritas (dados mockados)
- Cada item mostra: titulo, data/hora, sala onde ocorreu, participantes (avatares)
- Botao "Ver detalhes" que navega para a pagina de detalhes
- Ao clicar em ver detalhes abre aba lateral exibindo em formato notion a transcrição gerada (ata) da reunião e pontos discutidos pelos participantes

### Aba "Agendar"

- Formulario para agendar nova reuniao
- Campos: titulo, data, horario, sala (select), participantes (multi-select), descricao
- Botao de confirmar

**Novo arquivo:** `src/pages/MeetingDetailPage.tsx`

- Exibe detalhes completos da reuniao
- Secoes: Informacoes gerais (sala, data, duracao), Participantes, Transcricao da chamada (texto longo mockado com timestamps), Tarefas criadas a partir da reuniao (lista linkavel)

**Rota nova:** `/meetings/:id` no `App.tsx`

**Dados mockados:** `src/data/mockMeetings.ts`

- Array de reunioes com transcricao, participantes, data de inicio, data de fim...

---

## 4. Modulo Esteira (Kanban)

**Novo arquivo:** `src/pages/BoardPage.tsx`

Layout principal com abas (Tabs):

### Aba "Kanban"

- Board com colunas: Backlog, To Do, Em Progresso, Em Revisao, Concluido
- Cards com: titulo, id, prioridade (badge colorido), responsavel (avatar), tipo (badge)
- Drag and drop entre colunas usando estado local (sem lib externa -- simular com botoes de mover por enquanto, ou implementar drag basico com HTML5 DnD)

### Aba "Lista"

- Tabela com todas as tarefas do kanban mas em formato lista
- Colunas: ID, Titulo, Status, Prioridade, Responsavel, Tipo, Data
- Filtros no topo: por usuario, tipo, periodo

### Aba "Relatorio"

- Cards de metricas: total de tarefas, concluidas, em progresso, lead time medio
- Graficos simples com recharts: distribuicao por status (pie chart), tarefas concluidas por semana (bar chart)

### Aba "Prioridade"

- Listagem estilo Sprint Poker
- Cada tarefa exibe: titulo, estimativa de pontos, votos dos participantes (mockados)
- Visual inspirado em sessoes de planning poker com cards de pontuacao

### Botao "Nova Tarefa"

- Botao fixo no header do modulo
- Ao clicar, exibe dialog informando que o usuario sera direcionado a uma ligacao de voz com IA para descrever a tarefa
- Botao de confirmar que simula a acao (toast de confirmacao)

**Dados mockados:** `src/data/mockTasks.ts`

- Array de tarefas com campos: id, titulo, descricao, status, prioridade, responsavel, tipo, pontos, data de criacao

**Componentes auxiliares:**

- `src/components/board/KanbanColumn.tsx`
- `src/components/board/TaskCard.tsx`
- `src/components/board/TaskFilters.tsx`
- `src/components/board/PriorityPokerCard.tsx`
- `src/components/board/BoardReport.tsx`

---

## 5. Alteracoes em arquivos existentes


| Arquivo                                   | Alteracao                                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/components/AppSidebar.tsx`           | Remover secao de workspaces                                                                                        |
| `src/App.tsx`                             | Trocar PlaceholderPage de `/board` por `BoardPage`, `/meetings` por `MeetingsPage`, adicionar rota `/meetings/:id` |
| `src/pages/OfficePage.tsx`                | Remover MemberList como coluna fixa, integrar VoiceParticipants na area central                                    |
| `src/components/office/RoomItem.tsx`      | Adicionar flag de conectado e lista de participantes inline                                                        |
| `src/components/office/RoomList.tsx`      | Adicionar botao de criar canal e icone de editar                                                                   |
| `src/contexts/VoiceConnectionContext.tsx` | Sem alteracoes estruturais, apenas ajustes menores se necessario                                                   |


---

## Resumo de novos arquivos

```text
src/data/mockTasks.ts
src/data/mockMeetings.ts
src/pages/BoardPage.tsx
src/pages/MeetingsPage.tsx
src/pages/MeetingDetailPage.tsx
src/components/office/RoomFormDialog.tsx
src/components/office/VoiceParticipants.tsx
src/components/board/KanbanColumn.tsx
src/components/board/TaskCard.tsx
src/components/board/TaskFilters.tsx
src/components/board/PriorityPokerCard.tsx
src/components/board/BoardReport.tsx
```