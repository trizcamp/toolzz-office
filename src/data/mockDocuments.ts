export type BlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bulletList"
  | "numberedList"
  | "todoList"
  | "code"
  | "quote"
  | "callout"
  | "divider"
  | "toggle"
  | "image";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  metadata?: {
    language?: string;
    icon?: string;
    collapsed?: boolean;
  };
}

export interface Document {
  id: string;
  title: string;
  icon: string;
  taskId?: string;
  taskTitle?: string;
  type: "doc" | "spec" | "note" | "spreadsheet";
  updatedAt: string;
  blocks: Block[];
  comments: DocumentComment[];
}

export interface DocumentComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export const mockDocuments: Document[] = [
  {
    id: "doc-1",
    title: "Especificação: Autenticação OAuth",
    icon: "📄",
    taskId: "TOZ-101",
    taskTitle: "Implementar autenticação OAuth",
    type: "spec",
    updatedAt: "2025-02-14",
    blocks: [
      { id: "b1", type: "heading1", content: "Autenticação OAuth 2.0" },
      { id: "b2", type: "paragraph", content: "Este documento descreve a implementação do fluxo de autenticação OAuth 2.0 com suporte a Google e GitHub." },
      { id: "b3", type: "heading2", content: "Requisitos" },
      { id: "b4", type: "bulletList", content: "Login com Google" },
      { id: "b5", type: "bulletList", content: "Login com GitHub" },
      { id: "b6", type: "bulletList", content: "Refresh token automático" },
      { id: "b7", type: "bulletList", content: "Logout seguro" },
      { id: "b8", type: "heading2", content: "Fluxo Técnico" },
      { id: "b9", type: "numberedList", content: "Usuário clica em 'Entrar com Google'" },
      { id: "b10", type: "numberedList", content: "Redirecionamento para OAuth provider" },
      { id: "b11", type: "numberedList", content: "Callback com authorization code" },
      { id: "b12", type: "numberedList", content: "Troca por access token no backend" },
      { id: "b13", type: "code", content: "const { data } = await supabase.auth.signInWithOAuth({\n  provider: 'google',\n  options: { redirectTo: window.location.origin }\n});", metadata: { language: "typescript" } },
      { id: "b14", type: "callout", content: "Importante: Tokens devem ser armazenados de forma segura, nunca em localStorage.", metadata: { icon: "⚠️" } },
      { id: "b15", type: "divider", content: "" },
      { id: "b16", type: "heading2", content: "Notas" },
      { id: "b17", type: "paragraph", content: "A implementação foi concluída e está em produção desde 20/01/2025." },
    ],
    comments: [
      { id: "c1", author: "Beatriz F.", text: "Adicionei suporte a refresh automático de tokens.", createdAt: "2025-01-22 10:30" },
      { id: "c2", author: "João S.", text: "Reviu e aprovado. LGTM!", createdAt: "2025-01-23 14:15" },
    ],
  },
  {
    id: "doc-2",
    title: "Dashboard de Métricas — Planejamento",
    icon: "📊",
    taskId: "TOZ-103",
    taskTitle: "Dashboard de métricas",
    type: "doc",
    updatedAt: "2025-02-12",
    blocks: [
      { id: "b20", type: "heading1", content: "Dashboard de Métricas" },
      { id: "b21", type: "paragraph", content: "Documento de planejamento para o dashboard de métricas de uso e performance." },
      { id: "b22", type: "heading2", content: "Gráficos Previstos" },
      { id: "b23", type: "todoList", content: "Gráfico de uso diário", checked: true },
      { id: "b24", type: "todoList", content: "Gráfico de performance (latência)", checked: true },
      { id: "b25", type: "todoList", content: "Tabela de top endpoints", checked: false },
      { id: "b26", type: "todoList", content: "Mapa de calor de acessos", checked: false },
      { id: "b27", type: "quote", content: "O objetivo é dar visibilidade total sobre o uso da plataforma sem precisar de ferramentas externas." },
    ],
    comments: [
      { id: "c3", author: "Rafael M.", text: "Sugiro adicionar filtro por período.", createdAt: "2025-02-10 16:00" },
    ],
  },
  {
    id: "doc-3",
    title: "Anotações — Sprint 14",
    icon: "📝",
    type: "note",
    updatedAt: "2025-02-14",
    blocks: [
      { id: "b30", type: "heading1", content: "Sprint 14 — Notas" },
      { id: "b31", type: "paragraph", content: "Notas gerais do sprint 14, iniciado em 10/02." },
      { id: "b32", type: "heading2", content: "Objetivos" },
      { id: "b33", type: "bulletList", content: "Finalizar dashboard de métricas" },
      { id: "b34", type: "bulletList", content: "Corrigir bug de notificações duplicadas" },
      { id: "b35", type: "bulletList", content: "Iniciar tela de onboarding" },
    ],
    comments: [],
  },
];

export const typeLabelsDoc: Record<string, string> = {
  doc: "Documento",
  spec: "Especificação",
  note: "Nota",
  spreadsheet: "Planilha",
};
