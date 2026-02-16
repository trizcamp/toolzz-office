export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskType = "feature" | "bug" | "improvement" | "task" | string;

export interface TaskAssignee {
  id: string;
  name: string;
}

export interface PriorityVote {
  userId: string;
  userName: string;
  points: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: TaskAssignee[];
  type: TaskType;
  points: number;
  votes: PriorityVote[];
  createdAt: string;
  deliveryDate?: string;
}

const assignees: TaskAssignee[] = [
  { id: "1", name: "Beatriz F." },
  { id: "2", name: "João S." },
  { id: "3", name: "Rafael M." },
  { id: "4", name: "Amanda L." },
  { id: "5", name: "Thiago M." },
];

export const allAssignees = assignees;

export const mockTasks: Task[] = [
  {
    id: "TOZ-101",
    title: "Implementar autenticação OAuth",
    description: "Adicionar login com Google e GitHub usando OAuth 2.0",
    status: "done",
    priority: "critical",
    assignees: [assignees[0], assignees[1]],
    type: "feature",
    points: 8,
    votes: [
      { userId: "1", userName: "Beatriz F.", points: 8 },
      { userId: "2", userName: "João S.", points: 13 },
      { userId: "3", userName: "Rafael M.", points: 8 },
    ],
    createdAt: "2025-01-20",
    deliveryDate: "2025-02-14",
  },
  {
    id: "TOZ-102",
    title: "Corrigir bug no upload de arquivos",
    description: "Arquivos acima de 10MB falham silenciosamente",
    status: "review",
    priority: "high",
    assignees: [assignees[1]],
    type: "bug",
    points: 3,
    votes: [
      { userId: "1", userName: "Beatriz F.", points: 3 },
      { userId: "4", userName: "Amanda L.", points: 5 },
    ],
    createdAt: "2025-01-22",
    deliveryDate: "2025-02-16",
  },
  {
    id: "TOZ-103",
    title: "Dashboard de métricas",
    description: "Criar dashboard com gráficos de uso e performance",
    status: "in_progress",
    priority: "medium",
    assignees: [assignees[2], assignees[4]],
    type: "feature",
    points: 13,
    votes: [
      { userId: "2", userName: "João S.", points: 13 },
      { userId: "3", userName: "Rafael M.", points: 13 },
      { userId: "5", userName: "Thiago M.", points: 8 },
    ],
    createdAt: "2025-01-25",
    deliveryDate: "2025-02-20",
  },
  {
    id: "TOZ-104",
    title: "Melhorar performance do Kanban",
    description: "Otimizar renderização com virtualização de lista",
    status: "todo",
    priority: "medium",
    assignees: [assignees[3]],
    type: "improvement",
    points: 5,
    votes: [
      { userId: "1", userName: "Beatriz F.", points: 5 },
      { userId: "2", userName: "João S.", points: 5 },
    ],
    createdAt: "2025-01-28",
    deliveryDate: "2025-02-22",
  },
  {
    id: "TOZ-105",
    title: "Integração com Slack",
    description: "Enviar notificações de tarefas para canais do Slack",
    status: "backlog",
    priority: "low",
    assignees: [assignees[4]],
    type: "feature",
    points: 8,
    votes: [],
    createdAt: "2025-01-30",
  },
  {
    id: "TOZ-106",
    title: "Refatorar módulo de permissões",
    description: "Simplificar lógica de RBAC e adicionar testes",
    status: "backlog",
    priority: "high",
    assignees: [assignees[0]],
    type: "improvement",
    points: 13,
    votes: [
      { userId: "3", userName: "Rafael M.", points: 13 },
      { userId: "5", userName: "Thiago M.", points: 21 },
    ],
    createdAt: "2025-02-01",
  },
  {
    id: "TOZ-107",
    title: "Tela de onboarding",
    description: "Wizard de configuração inicial para novos usuários",
    status: "todo",
    priority: "medium",
    assignees: [assignees[1]],
    type: "feature",
    points: 5,
    votes: [
      { userId: "1", userName: "Beatriz F.", points: 5 },
      { userId: "4", userName: "Amanda L.", points: 8 },
    ],
    createdAt: "2025-02-03",
    deliveryDate: "2025-02-18",
  },
  {
    id: "TOZ-108",
    title: "Fix: Notificações duplicadas",
    description: "Usuários recebem a mesma notificação múltiplas vezes",
    status: "in_progress",
    priority: "critical",
    assignees: [assignees[2]],
    type: "bug",
    points: 3,
    votes: [],
    createdAt: "2025-02-05",
    deliveryDate: "2025-02-15",
  },
  {
    id: "TOZ-109",
    title: "API de relatórios",
    description: "Endpoint para exportar dados de tarefas em CSV e PDF",
    status: "todo",
    priority: "low",
    assignees: [assignees[3], assignees[0]],
    type: "task",
    points: 8,
    votes: [
      { userId: "2", userName: "João S.", points: 8 },
      { userId: "5", userName: "Thiago M.", points: 5 },
    ],
    createdAt: "2025-02-07",
    deliveryDate: "2025-02-25",
  },
  {
    id: "TOZ-110",
    title: "Tema escuro para emails",
    description: "Adaptar templates de email para suportar dark mode",
    status: "done",
    priority: "low",
    assignees: [assignees[4]],
    type: "improvement",
    points: 2,
    votes: [],
    createdAt: "2025-02-08",
    deliveryDate: "2025-02-12",
  },
];

export const statusLabels: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "Em Progresso",
  review: "Em Revisão",
  done: "Concluído",
};

export const priorityLabels: Record<TaskPriority, string> = {
  critical: "Crítica",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

export const defaultTypeLabels: Record<string, string> = {
  feature: "Feature",
  bug: "Bug",
  improvement: "Melhoria",
  task: "Tarefa",
};

export const typeLabels = defaultTypeLabels;

export const defaultTypeColors: Record<string, string> = {
  feature: "bg-primary/15 text-primary",
  bug: "bg-destructive/15 text-destructive",
  improvement: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
  task: "bg-muted text-muted-foreground",
};

export const fibonacciPoints = [1, 2, 3, 5, 8, 13, 21];
