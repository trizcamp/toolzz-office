

# Evolucao da Plataforma - Fase 2

Conjunto de melhorias e novos recursos distribuidos por todos os modulos.

---

## 1. Sidebar - Novo Modulo "Automatizacao"

**Arquivo:** `src/components/AppSidebar.tsx`
- Adicionar item "Automatizacao" com icone `Zap` e badge "Em breve" ao lado do label
- Item nao navegavel (disabled), apenas visual com badge

**Arquivo:** `src/App.tsx`
- Nenhuma rota nova necessaria (modulo desabilitado)

---

## 2. Modulo Reunioes - Filtro por Data

**Arquivo:** `src/pages/MeetingsPage.tsx`
- Adicionar input de filtro por data acima da listagem de reunioes na aba "Historico"
- Usar campo `type="date"` com estado `filterDate`
- Filtrar `mockMeetings` pelo campo `date` quando filtro estiver preenchido
- Botao para limpar filtro

---

## 3. Modulo Gerenciamento - Renomeacoes e Melhorias

### 3.1 Renomear "Esteira" para "Central de Tarefas"

**Arquivo:** `src/components/AppSidebar.tsx`
- Alterar label de "Gerenciamento" para "Central de Tarefas"

**Arquivo:** `src/pages/BoardPage.tsx`
- Alterar titulo h1 de "Esteira" para "Central de Tarefas"

### 3.2 Tela de Listagem de Centrais (pre-board)

**Arquivo:** `src/pages/BoardPage.tsx`
- Adicionar estado `selectedBoard` (null = visao geral, ou id de uma central)
- Quando `selectedBoard === null`, exibir grid com centrais de tarefas mockadas:
  - "Produto" (setor Produto), "Marketing" (setor Marketing), "Comercial" (setor Comercial)
  - Cada card mostra: nome, setor, contagem de tarefas, progresso
- Botao "+ Nova Central" abre modal para escolher modelo por setor
- Ao clicar em uma central, `selectedBoard` recebe o id e mostra o fluxo kanban/lista/poker atual

### 3.3 Modal de Nova Central

- Dialog com opcoes de setor: Marketing, Comercial, Produto
- Cada opcao e um card com icone e descricao
- Input para nome da central
- Ao criar, adiciona ao array e navega para dentro

### 3.4 Fullscreen do Documento na Task

**Arquivo:** `src/components/board/TaskDetailPanel.tsx`
- Ao clicar Maximizar no documento, renderizar o `BlockEditor` em fullscreen (overlay sobre a pagina inteira, mantendo apenas o sidebar de navegacao)
- Ao clicar Minimizar, voltar para o painel lateral
- Usar estado `fullscreenDoc` booleano

### 3.5 ID da Tarefa Editavel

**Arquivo:** `src/components/board/TaskDetailPanel.tsx`
- Trocar o Badge do ID por um Input editavel
- Ao alterar, chamar `onUpdate` com o novo id

### 3.6 Responsaveis Multiplos

**Arquivo:** `src/data/mockTasks.ts`
- Alterar `assignee: TaskAssignee` para `assignees: TaskAssignee[]`

**Arquivos afetados:** `TaskDetailPanel.tsx`, `TaskCard.tsx`, `BoardPage.tsx`, `NewTaskDialog.tsx`, `PriorityPokerCard.tsx`
- Renderizar multiplos avatares/nomes
- No detalhe, permitir adicionar/remover responsaveis

### 3.7 Tipo Customizavel com "+ Adicionar"

**Arquivo:** `src/data/mockTasks.ts`
- Manter `typeLabels` como estado mutavel na BoardPage
- Adicionar `typeColors` map

**Arquivo:** `src/components/board/TaskDetailPanel.tsx`
- No Select de tipo, adicionar opcao "+ Adicionar tipo"
- Ao clicar, exibir input inline para nome + cor
- Novo tipo e adicionado ao mapa e fica disponivel para selecao

### 3.8 Modal de Assistente de IA (conforme referencia image-17)

**Arquivo:** `src/components/board/NewTaskDialog.tsx`
- Substituir modo `ai-select` (2 botoes separados) por um modal unico estilo image-17:
  - Card escuro centralizado com icone de microfone grande
  - Texto "Conversar com IA" + "Clique para falar ou digite"
  - Dois botoes: "Via texto" e "Via voz" com icones
- Layout identico a referencia

---

## 4. Modulo Escritorio - Relatorio com Custo e Performance

**Arquivo:** `src/pages/BoardPage.tsx` (aba Relatorio)
**Arquivo:** `src/components/board/BoardReport.tsx`
- Adicionar secao "Custo da Feature" com metricas mockadas:
  - Horas do gestor, horas de desenvolvimento, custo plataforma
  - Total estimado em R$
- Adicionar secao "Performance da Equipe":
  - Tabela por membro: nome, tarefas entregues, atrasos, no prazo, indice de desgaste
  - Indicadores visuais (verde/amarelo/vermelho)
- Dados sao mockados para demonstracao

---

## 5. Modulo Documentos - Melhorias no Editor

### 5.1 Texto da Esquerda para Direita + Markdown Automatico

**Arquivo:** `src/components/documents/BlockEditor.tsx`
- Adicionar `dir="ltr"` e `style={{ textAlign: "left" }}` nos blocos contentEditable
- Ja existe deteccao automatica de markdown (`# `, `* `, etc.) -- validar que funciona corretamente

### 5.2 Upload de Imagem

**Arquivo:** `src/data/mockDocuments.ts`
- Adicionar tipo `"image"` ao `BlockType`

**Arquivo:** `src/components/documents/BlockEditor.tsx`
- Adicionar bloco de imagem: ao selecionar "Imagem" no slash command, exibir input file
- Imagem armazenada como data URL no content do bloco (local/mock)
- Renderizar com tag `<img>` no bloco

**Arquivo:** `src/components/documents/SlashCommandMenu.tsx`
- Adicionar entrada "Imagem" no menu de comandos

### 5.3 Selecao de Linguagem no Bloco de Codigo

**Arquivo:** `src/components/documents/BlockEditor.tsx`
- No bloco de codigo, adicionar Select/dropdown no canto superior direito
- Linguagens: TypeScript, JavaScript, SQL, Python, Java, C#, Go, Rust, PHP, Ruby, HTML, CSS, JSON, YAML, Bash, Markdown
- Ao selecionar, atualizar `metadata.language`
- Estilizacao diferenciada por linguagem (cores do label)

---

## 6. Modulo Calendario - Melhorias

**Arquivo:** `src/pages/CalendarPage.tsx`

### 6.1 Renomear e Reorganizar
- Trocar "Planner" por "Calendario" no titulo
- Mover categorias (filtros) para abaixo do titulo "Calendario", renomear para "Tarefas" e "Reunioes"

### 6.2 Exibir Tarefas com Datas de Entrega
- Usar campo `deliveryDate` (ou `createdAt` como fallback) para posicionar tarefas
- Exibir como blocos no calendario com data inicio-fim

### 6.3 Reunioes no Horario Correto
- Ja funcional -- validar e ajustar se necessario

### 6.4 Paineis Minimaveis
- Adicionar botao de colapsar/expandir em cada painel (esquerdo, central, direito)
- Usar estado booleano para cada painel
- Quando colapsado, mostrar apenas uma faixa fina com botao para reabrir

---

## 7. Modulo Integracoes - Ajustes

**Arquivo:** `src/pages/IntegrationsPage.tsx`
- Trocar "GitLab" por "Make" (automacao)
- Manter badge "Em breve" no Make
- Copiar icones das imagens enviadas para `src/assets/`:
  - `make-icon.png` (image-20 -- icone roxo Make)
  - `figma-icon.png` (image-19 -- icone Figma)
  - `slack-icon.png` (image-18 -- icone Slack, nota: imagem aparece branca/vazia, usar emoji ou SVG)
- Substituir emojis por imagens reais nos cards:
  - GitHub: usar SVG inline (icone GitHub padrao)
  - Make: usar `make-icon.png`
  - Slack: usar SVG inline (icone Slack padrao)
  - Figma: usar `figma-icon.png`

---

## Resumo de Arquivos

### Novos Arquivos
```text
src/assets/make-icon.png       (copiar de image-20)
src/assets/figma-icon.png      (copiar de image-19)
```

### Arquivos Modificados
```text
src/components/AppSidebar.tsx           -- "Automatizacao" com badge
src/pages/MeetingsPage.tsx              -- filtro por data
src/pages/BoardPage.tsx                 -- renomear, listagem de centrais, modal nova central
src/components/board/BoardReport.tsx    -- custo de feature + performance equipe
src/components/board/TaskDetailPanel.tsx -- fullscreen doc, ID editavel, responsaveis multiplos, tipo customizavel
src/components/board/NewTaskDialog.tsx  -- modal IA estilo referencia
src/components/board/TaskCard.tsx       -- multiplos responsaveis
src/components/board/PriorityPokerCard.tsx -- multiplos responsaveis
src/data/mockTasks.ts                   -- assignees array, deliveryDate, typeColors
src/components/documents/BlockEditor.tsx -- dir ltr, imagem block, linguagem select
src/components/documents/SlashCommandMenu.tsx -- adicionar "Imagem"
src/data/mockDocuments.ts               -- tipo "image"
src/pages/CalendarPage.tsx              -- renomear, categorias, paineis minimaveis
src/pages/IntegrationsPage.tsx          -- Make no lugar de GitLab, icones reais
```

### Ordem de Implementacao
1. Tema/Sidebar (Automatizacao badge)
2. Integracoes (icones + Make)
3. Reunioes (filtro data)
4. Gerenciamento (renomear, centrais, task detail melhorias)
5. Documentos (imagem, linguagens, ltr)
6. Calendario (renomear, minimaveis)
7. Relatorio (custo + performance)

