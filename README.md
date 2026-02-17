# Toolzz Office

Plataforma de gestão de projetos e colaboração em equipe, construída com React, TypeScript e Supabase.

## Equipe 313

| Integrante | Nome Completo | Função | E-mail | WhatsApp |
|---|---|---|---|---|
| 1 | Beatriz Felix Campache | Vibecoder | beatriz.campache@toolzz.me | (11) 93338-3407 |
| 2 | João Henrique Lebrão Graziotto | Negócios | joaograziotto@gmail.com | (11) 99471-8335 |

---

## Visão Geral

O Toolzz Office é um workspace digital completo para equipes de desenvolvimento, unindo gerenciamento de tarefas (Kanban), documentação colaborativa, escritório virtual com salas de voz/texto, reuniões, calendário, integrações e assistente de IA — tudo em uma única interface.

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| UI | Tailwind CSS, shadcn/ui, Framer Motion |
| Estado / Cache | TanStack React Query |
| Roteamento | React Router DOM v6 |
| Backend | Lovable Cloud (Supabase) |
| Banco de Dados | PostgreSQL com Row Level Security (RLS) |
| Realtime | Supabase Realtime (Postgres Changes) |
| Serverless | Supabase Edge Functions (Deno) |
| IA | Lovable AI Gateway (Gemini / GPT) |

## Arquitetura

```
src/
├── components/          # Componentes React reutilizáveis
│   ├── board/           # Kanban: cards, colunas, filtros, relatórios
│   ├── documents/       # Editor de blocos, slash commands
│   ├── office/          # Salas de voz/texto, lista de membros
│   ├── settings/        # Dialog de configurações
│   └── ui/              # Componentes base (shadcn/ui)
├── contexts/            # Contextos React (VoiceConnection)
├── data/                # Dados mock e definições de tipos
├── hooks/               # Custom hooks (auth, tasks, boards, etc.)
├── integrations/        # Cliente Supabase e tipos gerados
├── pages/               # Páginas da aplicação
└── assets/              # Imagens e ícones

supabase/
├── functions/           # Edge Functions serverless
│   ├── ai-chat/         # Assistente IA com tool calling
│   ├── ai-analyze-meeting/ # Análise de reuniões com IA
│   ├── github-api/      # Proxy para GitHub API
│   ├── github-callback/ # OAuth callback do GitHub
│   ├── invite-member/   # Convite de membros por email
│   ├── task-created/    # Webhook pós-criação de tarefa
│   └── transcribe-audio/ # Transcrição de áudio
└── migrations/          # Migrações SQL do banco de dados
```

## Módulos Principais

### 🗂 Board (Kanban)
- Colunas: Backlog → To Do → Em Progresso → Em Revisão → Concluído
- Drag & drop de tarefas entre colunas
- Tipos customizáveis por board (Feature, Bug, Melhoria, Tarefa)
- Priority Poker: votação Fibonacci para estimativa de pontos
- Relatórios de performance por membro e sprint
- Subtarefas (parent_id)
- Integração GitHub: criação automática de issues para bugs/melhorias

### 📄 Documentos
- Editor de blocos estilo Notion (parágrafos, headings, listas, código, callouts, etc.)
- Slash commands para inserção rápida de blocos
- Documentos vinculados a tarefas (gerados automaticamente via IA)
- Tipos: Doc, Spec, Note

### 🏢 Escritório Virtual
- Salas de voz, texto e híbridas
- Chat em tempo real com Supabase Realtime
- Lista de membros com presença online
- Categorias de salas personalizáveis

### 📅 Reuniões & Calendário
- Agendamento de reuniões com participantes
- Transcrição de áudio em tempo real
- Análise de reunião com IA (resumo, action items)
- Vinculação de tarefas a reuniões

### 🤖 Assistente IA (Toolzz Chat)
- Chat conversacional integrado ao board
- Criação de tarefas por linguagem natural (tool calling)
- Geração automática de documentação (User Story, Critérios de Aceite, Notas Técnicas)
- Criação automática de issues no GitHub para bugs/melhorias

### 🔗 Integrações
- **GitHub**: OAuth, listagem de repos, criação de issues vinculadas a tarefas
- **Automações**: Página de automações (em desenvolvimento)

## Modelo de Dados

```
boards ──┬── tasks ──┬── task_assignees ──► members
         │           ├── task_votes
         │           ├── documents ──── document_blocks
         │           │                  document_comments
         │           └── meeting_tasks ──► meetings
         │
         └── board_members ──► members
                               type_definitions

rooms ──── messages
meetings ──── meeting_participants
              meeting_transcripts

members (perfil público, vinculado a auth.users)
notifications
activity_logs
github_integrations
user_roles (admin | member)
```

### Automações via Triggers
- **Auto board member**: ao atribuir um responsável a uma tarefa (`task_assignees`), o membro é automaticamente adicionado ao board (`board_members`), garantindo visibilidade nos relatórios de performance.
- **Display ID sequencial**: tarefas recebem IDs legíveis (TOZ-001, TOZ-002...) via trigger.

## Segurança
- Row Level Security (RLS) ativo em todas as tabelas
- Autenticação via email/senha com confirmação de email
- Reset de senha com redirecionamento
- Roles: admin e member (tabela `user_roles`)

## Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase (automático) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública do Supabase (automático) |
| `LOVABLE_API_KEY` | Chave para o AI Gateway (secret no Edge Function) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | OAuth do GitHub (secrets) |

## Como Rodar Localmente

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev
```

## Deploy

Abra o [Lovable](https://lovable.dev) e clique em **Share → Publish**.

---

**URL do Projeto**: https://toolzz-office.lovable.app
