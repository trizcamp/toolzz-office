

# Modulo Escritorio -- Salas Colaborativas (Estilo Discord)

## Visao Geral

Construir o modulo "Escritorio" com salas de voz e texto estilo Discord, incluindo conexao persistente que sobrevive a navegacao entre paginas, mini player fixo global e interface completa de sala.

Como ainda nao ha backend/Supabase conectado, toda a logica sera simulada com estado local (React Context), preparando a arquitetura para integracao futura com WebRTC/Supabase Realtime.

---

## Arquitetura

```text
AppLayout
├── AppSidebar
├── Content Area
│   ├── TopBar
│   └── <Outlet /> (paginas)
│       └── /chat -> OfficePage
│           ├── Sidebar de Salas (categorias + lista)
│           └── Area da Sala Ativa (chat + membros)
└── VoiceConnectionBar (fixo no bottom, visivel em TODAS as paginas)
```

O estado de conexao de voz vive em um **React Context** (`VoiceConnectionContext`) no nivel do `App`, garantindo persistencia ao navegar.

---

## Componentes e Arquivos

### 1. Context Global -- `src/contexts/VoiceConnectionContext.tsx`
- Estado: sala conectada (nome, id, categoria), status do mic, status do audio, usuario
- Acoes: conectar a sala, desconectar, toggle mute, toggle deafen
- Dados mockados de usuarios conectados por sala

### 2. Pagina Escritorio -- `src/pages/OfficePage.tsx`
Layout em 3 colunas:
- **Coluna esquerda (220px):** Lista de salas agrupadas por categoria
  - Categorias: Geral, Produto, Mentoria, Equipes
  - Tipos de sala com icones: voz, texto, hibrida
  - Indicador de usuarios conectados por sala
  - Sala ativa destacada visualmente
- **Coluna central (flex-1):** Area de chat/conteudo da sala selecionada
  - Chat com mensagens mockadas
  - Input de mensagem na parte inferior
- **Coluna direita (220px):** Lista de membros conectados
  - Avatar + nome + indicador de "falando"
  - Botao de convidar membro

### 3. Barra Fixa de Voz -- `src/components/VoiceConnectionBar.tsx`
- Posicionada no bottom do `AppLayout`, acima de tudo
- Visivel apenas quando conectado a uma sala de voz
- Conteudo:
  - Nome da sala + categoria
  - Botao mute/unmute microfone
  - Botao deafen/undeafen audio
  - Botao de configuracoes (popover com selecao de mic/audio/volume)
  - Botao de desconectar (vermelho)
  - Avatar do usuario
- Animacao de entrada/saida suave com framer-motion

### 4. Componentes auxiliares
- `src/components/office/RoomList.tsx` -- lista lateral de salas
- `src/components/office/ChatArea.tsx` -- area de chat da sala
- `src/components/office/MemberList.tsx` -- lista de membros conectados
- `src/components/office/RoomItem.tsx` -- item individual de sala

### 5. Alteracoes em arquivos existentes
- **`src/App.tsx`**: Envolver com `VoiceConnectionProvider`; trocar rota `/chat` de PlaceholderPage para OfficePage
- **`src/components/AppLayout.tsx`**: Adicionar `VoiceConnectionBar` no bottom, abaixo do `<main>`

---

## Dados Mockados

Categorias e salas de exemplo:

| Categoria | Sala | Tipo | Usuarios |
|-----------|------|------|----------|
| Geral | Lobby | hibrida | 3 |
| Geral | Avisos | texto | -- |
| Produto | Daily | voz | 2 |
| Produto | Sprint Review | hibrida | 0 |
| Produto | Backlog | texto | -- |
| Mentoria | Sessao 1:1 | voz | 1 |
| Equipes | Design | hibrida | 4 |
| Equipes | Engenharia | voz | 2 |

Usuarios mockados: Beatriz F., Joao S., Rafael M., Amanda L., Thiago M.

---

## Comportamento de Navegacao

1. Usuario clica em sala de voz/hibrida -> conecta (estado no context)
2. Navega para /board, /, /docs -> VoiceConnectionBar permanece visivel
3. Volta para /chat -> sala ainda esta selecionada e ativa
4. Clica em "Desconectar" na barra -> limpa estado, barra desaparece
5. Fechar aba -> estado perde-se (sem persistencia em storage)

---

## Design Visual

- Segue o tema dark existente (tokens de cor ja configurados)
- Salas de voz: icone `Volume2`, salas de texto: icone `Hash`, hibridas: icone `Headphones`
- Indicador de "falando" com borda verde pulsante no avatar
- Barra de voz com fundo `glass` e borda sutil
- Hover states e transicoes suaves em todos os elementos interativos
- Separacao de categorias com labels uppercase tracking-widest (mesmo padrao da sidebar)

---

## Detalhes Tecnicos

- **Sem dependencias novas** -- tudo com React, framer-motion, lucide-react e componentes UI existentes
- **React Context + useReducer** para gerenciar estado de voz
- **framer-motion** para animacoes de entrada da barra e transicoes de sala
- Audio real nao sera implementado (mock visual apenas), preparado para integracao futura
- Chat com scroll automatico para ultima mensagem
- Layout responsivo: em telas menores, a lista de membros colapsa e a sidebar de salas vira um drawer

