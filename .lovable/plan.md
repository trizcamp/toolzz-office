

# Melhorias Multi-Modulo - Fase 3

Conjunto de refinamentos cobrindo Gerenciamento, Documentos, Escritorio e novo modal de Configuracoes.

---

## 1. Modulo Gerenciamento (Central de Tarefas)

### 1.1 Modal de Edicao da Central (substituir inline edit)

**Arquivo:** `src/pages/BoardPage.tsx`
- Substituir a edicao inline do nome por um Dialog/modal ao clicar no botao de editar (Pencil)
- Modal com campos: "Nome da Central" (Input) e "Descricao" (Textarea opcional)
- Adicionar campo `description` a interface `BoardDef`
- Botoes "Cancelar" e "Salvar"

### 1.2 Filtros Avancados na Lista e Kanban

**Arquivo:** `src/components/board/TaskFilters.tsx`
- Expandir componente para incluir filtros adicionais:
  - **Responsavel** (ja existente)
  - **Tipo** (ja existente)
  - **Prioridade** (novo Select: Critica, Alta, Media, Baixa)
  - **Etapa/Status** (novo Select: Backlog, To Do, Em Progresso, Em Revisao, Concluido)
  - **Data** (novo input type="date" para filtrar por `createdAt` ou `deliveryDate`)
- Envolver tudo em um botao "Filtros" que ao clicar expande/recolhe a barra de filtros (toggle)

**Arquivo:** `src/pages/BoardPage.tsx`
- Adicionar estados para `priorityFilter`, `statusFilter`, `dateFilter`
- Passar novos filtros ao `TaskFilters` e aplicar no `filteredTasks`
- Exibir botao de filtro tambem na aba Kanban (acima das colunas)

### 1.3 Documentacao Lateral no Modo Lista

**Arquivo:** `src/pages/BoardPage.tsx`
- O `TaskDetailPanel` ja abre via `selectedTask` e ja funciona no modo Kanban
- Garantir que ao clicar numa tarefa na tabela (modo Lista), o mesmo `TaskDetailPanel` com documentacao seja renderizado ao lado (ja esta no JSX no final do componente, fora das abas -- verificar se funciona corretamente para a aba lista)
- O painel ja esta posicionado fora das `TabsContent`, portanto ja deve funcionar -- validar que nao ha conflito de overflow

### 1.4 Tipo com Nome Visivel (nao apenas cor)

**Arquivo:** `src/pages/BoardPage.tsx` (coluna Tipo na tabela)
- Ja exibe `typeLabelsState[task.type]` -- validar
- Adicionar a cor de fundo do tipo ao Badge: usar `typeColorsState[task.type]` nas classes do Badge

**Arquivo:** `src/components/board/TaskCard.tsx`
- No card do Kanban, exibir Badge com nome do tipo + cor correspondente
- Passar `typeLabels` e `typeColors` como props

**Arquivo:** `src/components/board/TaskDetailPanel.tsx`
- No Select de tipo, exibir o nome do tipo com a cor de fundo correspondente no SelectTrigger

---

## 2. Modulo Documentos

### 2.1 Cursor e Texto LTR

**Arquivo:** `src/components/documents/BlockEditor.tsx`
- Ja possui `dir="ltr"` e `text-align: left` nos blocos contentEditable
- Adicionar `direction: ltr` ao CSS global do `[contenteditable]` (ja presente)
- Validar que a regra CSS esta correta -- nenhuma mudanca necessaria (ja implementado)

---

## 3. Modulo Escritorio

### 3.1 Menu de Contexto (botao direito) para Apagar Canal

**Arquivo:** `src/components/office/RoomItem.tsx`
- Adicionar evento `onContextMenu` no componente do canal
- Ao clicar com botao direito, exibir menu de contexto customizado (ContextMenu do Radix ou div posicionada)
- Opcao "Apagar canal" com confirmacao (AlertDialog)
- Passar callback `onDelete` do `RoomList` para `RoomItem`

**Arquivo:** `src/components/office/RoomList.tsx`
- Adicionar funcao `handleDeleteRoom` que remove a sala do array
- Passar `onDelete` para cada `RoomItem`

### 3.2 Configuracoes de Audio (Mic/Saida)

**Arquivo:** `src/components/office/VoiceParticipants.tsx`
- Adicionar botao de engrenagem (Settings) ao lado dos controles de voz
- Ao clicar, abrir Popover ou Dialog com:
  - Select "Dispositivo de Entrada (Microfone)" com opcoes mockadas (Microfone Padrao, Headset USB, etc.)
  - Select "Dispositivo de Saida (Audio)" com opcoes mockadas (Alto-falantes, Fones de ouvido, etc.)
- Armazenar selecao em estado local

---

## 4. Modal de Configuracoes (Global)

### 4.1 Trigger no TopBar

**Arquivo:** `src/components/TopBar.tsx`
- Ao clicar no icone de Settings (engrenagem), abrir o modal de Configuracoes
- Adicionar estado `settingsOpen` e renderizar o novo componente `SettingsDialog`

### 4.2 Componente SettingsDialog

**Novo arquivo:** `src/components/settings/SettingsDialog.tsx`
- Dialog fullscreen ou grande (max-w-3xl)
- Layout com sidebar esquerda + conteudo direito (conforme referencia image-24)
- Sidebar com abas: "Minha conta", "Membros"
- Estado `activeTab` para alternar entre as abas

### 4.3 Aba "Minha Conta"

- Cabecalho: icone + "Minha conta" + subtitulo "Altere as suas informacoes pessoais"
- Foto de perfil: avatar com iniciais + botoes "Enviar imagem" e "Remover imagem"
- Campos (todos mockados/editaveis localmente):
  - Nome, Sobrenome (2 colunas)
  - E-mail
  - Celular, Idioma (2 colunas, idioma como Select)
  - Secao "Alterar senha" com botao
- Botoes "Cancelar" e "Salvar" no rodape

### 4.4 Aba "Membros"

- Cabecalho: icone + "Membros" + subtitulo "Gerencie membros e usuarios e defina seu nivel de acesso"
- Input de busca + botao "+ Convidar"
- Tabela com colunas: Membro (avatar + nome + email), Acesso (ADMINISTRADOR / MEMBRO)
- Primeiro membro com "(voce)" ao lado do nome -- sem botao de acoes
- Demais membros: botao "..." (DropdownMenu) com opcoes "Tornar membro" e "Excluir"
- Ao clicar "+ Convidar": sub-dialog "Convidar membro" com campos Nome, E-mail, Acesso (Select: Administrador/Membro) e botoes Cancelar/Convidar
- Dados mockados: lista de 4 membros conforme referencia

---

## Resumo de Arquivos

### Novos Arquivos
```text
src/components/settings/SettingsDialog.tsx    -- Modal de configuracoes com abas Conta e Membros
```

### Arquivos Modificados
```text
src/pages/BoardPage.tsx                       -- Modal edicao central, filtros avancados, tipo com cor+nome
src/components/board/TaskFilters.tsx           -- Filtros prioridade, etapa, data + toggle
src/components/board/TaskCard.tsx              -- Badge de tipo com nome e cor
src/components/office/RoomItem.tsx             -- Context menu (botao direito) para apagar canal
src/components/office/RoomList.tsx             -- Handler de delete room
src/components/office/VoiceParticipants.tsx    -- Popover config audio (mic/saida)
src/components/TopBar.tsx                      -- Trigger para SettingsDialog
```

### Ordem de Implementacao
1. Gerenciamento (modal edicao, filtros, tipo com nome)
2. Escritorio (context menu, config audio)
3. Configuracoes (SettingsDialog com abas)

