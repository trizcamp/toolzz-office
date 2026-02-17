import {
  Kanban, ListChecks, UserPlus, ArrowRightLeft, CalendarPlus, CalendarCheck, CalendarX, FileText, FilePlus,
  Bot, Bell, Mail, MessageSquare, Webhook, Table2, Calculator, Send, Clock, Filter,
  type LucideIcon,
} from "lucide-react";

interface ConfigField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface TriggerDef {
  value: string;
  label: string;
  icon: LucideIcon;
  category: string;
  configFields?: ConfigField[];
}

interface ActionDef {
  value: string;
  label: string;
  icon: LucideIcon;
  category: string;
  color: string;
  description: string;
  configFields?: ConfigField[];
}

// ---- TRIGGERS ----
export const TRIGGERS: { category: string; items: TriggerDef[] }[] = [
  {
    category: "Board / Tarefas",
    items: [
      {
        value: "task_created",
        label: "Tarefa criada",
        icon: ListChecks,
        category: "Board",
        configFields: [
          { key: "priority", label: "Prioridade (opcional)", type: "select", placeholder: "Qualquer", options: [
            { value: "any", label: "Qualquer" }, { value: "critical", label: "Crítica" }, { value: "high", label: "Alta" }, { value: "medium", label: "Média" }, { value: "low", label: "Baixa" },
          ]},
        ],
      },
      {
        value: "task_status_changed",
        label: "Status alterado",
        icon: ArrowRightLeft,
        category: "Board",
        configFields: [
          { key: "to_status", label: "Novo status", type: "select", placeholder: "Qualquer", options: [
            { value: "any", label: "Qualquer" }, { value: "todo", label: "To Do" }, { value: "in_progress", label: "Em progresso" }, { value: "review", label: "Em revisão" }, { value: "done", label: "Concluído" },
          ]},
        ],
      },
      {
        value: "task_assigned",
        label: "Tarefa atribuída",
        icon: UserPlus,
        category: "Board",
      },
    ],
  },
  {
    category: "Reuniões",
    items: [
      { value: "meeting_created", label: "Reunião criada", icon: CalendarPlus, category: "Reuniões" },
      { value: "meeting_accepted", label: "Convite aceito", icon: CalendarCheck, category: "Reuniões" },
      { value: "meeting_declined", label: "Convite recusado", icon: CalendarX, category: "Reuniões" },
    ],
  },
  {
    category: "Documentos",
    items: [
      { value: "document_created", label: "Documento criado", icon: FilePlus, category: "Documentos" },
      { value: "document_updated", label: "Documento atualizado", icon: FileText, category: "Documentos" },
    ],
  },
  {
    category: "Notificações",
    items: [
      { value: "notification_received", label: "Notificação recebida", icon: Bell, category: "Notificações" },
    ],
  },
  {
    category: "Agendamento",
    items: [
      { value: "schedule_cron", label: "Agendamento (CRON)", icon: Clock, category: "Agendamento", configFields: [
        { key: "cron_expression", label: "Expressão CRON", type: "text", placeholder: "0 9 * * 1 (Seg 9h)" },
      ]},
    ],
  },
];

// ---- ACTIONS ----
export const ACTIONS: { category: string; items: ActionDef[] }[] = [
  {
    category: "IA / Inteligência",
    items: [
      {
        value: "ai_analyze",
        label: "Analisar com IA",
        icon: Bot,
        category: "IA",
        color: "bg-violet-500/15 text-violet-500",
        description: "Usar IA para analisar dados e gerar insights",
        configFields: [
          { key: "prompt", label: "Prompt", type: "textarea", placeholder: "Analise o contexto e gere um resumo..." },
          { key: "model", label: "Modelo", type: "select", options: [
            { value: "gemini-flash", label: "Gemini Flash (rápido)" },
            { value: "gemini-pro", label: "Gemini Pro (preciso)" },
            { value: "gpt5-mini", label: "GPT-5 Mini" },
          ]},
        ],
      },
      {
        value: "ai_generate_text",
        label: "Gerar texto com IA",
        icon: Bot,
        category: "IA",
        color: "bg-violet-500/15 text-violet-500",
        description: "Gerar conteúdo textual automaticamente",
        configFields: [
          { key: "prompt", label: "Prompt de geração", type: "textarea", placeholder: "Gere um relatório sobre..." },
        ],
      },
    ],
  },
  {
    category: "Ações internas",
    items: [
      {
        value: "create_task",
        label: "Criar tarefa",
        icon: ListChecks,
        category: "Board",
        color: "bg-blue-500/15 text-blue-500",
        description: "Criar uma nova tarefa no board",
        configFields: [
          { key: "title_template", label: "Título (template)", type: "text", placeholder: "{{trigger.title}} - Follow up" },
          { key: "priority", label: "Prioridade", type: "select", options: [
            { value: "low", label: "Baixa" }, { value: "medium", label: "Média" }, { value: "high", label: "Alta" }, { value: "critical", label: "Crítica" },
          ]},
          { key: "status", label: "Status inicial", type: "select", options: [
            { value: "backlog", label: "Backlog" }, { value: "todo", label: "To Do" },
          ]},
        ],
      },
      {
        value: "create_document",
        label: "Criar documento",
        icon: FileText,
        category: "Documentos",
        color: "bg-emerald-500/15 text-emerald-500",
        description: "Criar um novo documento automaticamente",
        configFields: [
          { key: "title_template", label: "Título (template)", type: "text", placeholder: "Ata: {{trigger.title}}" },
          { key: "doc_type", label: "Tipo", type: "select", options: [
            { value: "doc", label: "Documento" }, { value: "note", label: "Nota" }, { value: "spec", label: "Especificação" },
          ]},
        ],
      },
      {
        value: "send_notification",
        label: "Enviar notificação",
        icon: Bell,
        category: "Notificações",
        color: "bg-amber-500/15 text-amber-500",
        description: "Enviar notificação interna para usuários",
        configFields: [
          { key: "title_template", label: "Título", type: "text", placeholder: "Nova atualização: {{trigger.title}}" },
          { key: "body_template", label: "Corpo", type: "textarea", placeholder: "Detalhes da notificação..." },
          { key: "target", label: "Destinatário", type: "select", options: [
            { value: "trigger_user", label: "Usuário do gatilho" }, { value: "all_board_members", label: "Todos do board" }, { value: "task_assignees", label: "Assignados da tarefa" },
          ]},
        ],
      },
      {
        value: "update_task_status",
        label: "Alterar status da tarefa",
        icon: ArrowRightLeft,
        category: "Board",
        color: "bg-blue-500/15 text-blue-500",
        description: "Mover tarefa para outro status",
        configFields: [
          { key: "new_status", label: "Novo status", type: "select", options: [
            { value: "backlog", label: "Backlog" }, { value: "todo", label: "To Do" }, { value: "in_progress", label: "Em progresso" }, { value: "review", label: "Em revisão" }, { value: "done", label: "Concluído" },
          ]},
        ],
      },
      {
        value: "create_spreadsheet",
        label: "Criar planilha",
        icon: Table2,
        category: "Documentos",
        color: "bg-emerald-500/15 text-emerald-500",
        description: "Criar uma planilha com dados do gatilho",
        configFields: [
          { key: "title_template", label: "Título", type: "text", placeholder: "Relatório {{date}}" },
        ],
      },
    ],
  },
  {
    category: "Integrações externas",
    items: [
      {
        value: "send_email",
        label: "Enviar e-mail",
        icon: Mail,
        category: "Externo",
        color: "bg-red-500/15 text-red-500",
        description: "Enviar e-mail automático",
        configFields: [
          { key: "to", label: "Para", type: "text", placeholder: "email@exemplo.com" },
          { key: "subject_template", label: "Assunto", type: "text", placeholder: "Atualização: {{trigger.title}}" },
          { key: "body_template", label: "Corpo", type: "textarea", placeholder: "Olá, segue atualização..." },
        ],
      },
      {
        value: "send_whatsapp",
        label: "Enviar WhatsApp",
        icon: MessageSquare,
        category: "Externo",
        color: "bg-green-500/15 text-green-500",
        description: "Enviar mensagem via WhatsApp",
        configFields: [
          { key: "phone", label: "Telefone", type: "text", placeholder: "+55 11 99999-9999" },
          { key: "message_template", label: "Mensagem", type: "textarea", placeholder: "Nova tarefa: {{trigger.title}}" },
        ],
      },
      {
        value: "webhook",
        label: "Webhook (HTTP)",
        icon: Webhook,
        category: "Externo",
        color: "bg-orange-500/15 text-orange-500",
        description: "Chamar URL externa com dados do gatilho",
        configFields: [
          { key: "url", label: "URL", type: "text", placeholder: "https://hooks.zapier.com/..." },
          { key: "method", label: "Método", type: "select", options: [
            { value: "POST", label: "POST" }, { value: "GET", label: "GET" }, { value: "PUT", label: "PUT" },
          ]},
        ],
      },
      {
        value: "calculate",
        label: "Cálculo / Fórmula",
        icon: Calculator,
        category: "Lógica",
        color: "bg-cyan-500/15 text-cyan-500",
        description: "Executar cálculo com dados do gatilho",
        configFields: [
          { key: "formula", label: "Fórmula", type: "text", placeholder: "{{trigger.points}} * 1.5" },
          { key: "output_var", label: "Nome da variável de saída", type: "text", placeholder: "resultado" },
        ],
      },
    ],
  },
  {
    category: "Controle de fluxo",
    items: [
      {
        value: "delay",
        label: "Aguardar (delay)",
        icon: Clock,
        category: "Fluxo",
        color: "bg-gray-500/15 text-gray-500",
        description: "Pausar execução por um tempo",
        configFields: [
          { key: "delay_minutes", label: "Minutos de espera", type: "text", placeholder: "5" },
        ],
      },
      {
        value: "condition",
        label: "Condição (if/else)",
        icon: Filter,
        category: "Fluxo",
        color: "bg-gray-500/15 text-gray-500",
        description: "Executar próxima ação somente se condição for verdadeira",
        configFields: [
          { key: "field", label: "Campo", type: "text", placeholder: "{{trigger.priority}}" },
          { key: "operator", label: "Operador", type: "select", options: [
            { value: "equals", label: "Igual a" }, { value: "not_equals", label: "Diferente de" }, { value: "contains", label: "Contém" },
          ]},
          { key: "value", label: "Valor", type: "text", placeholder: "critical" },
        ],
      },
    ],
  },
];

export function getTriggerDef(value: string): TriggerDef | undefined {
  for (const group of TRIGGERS) {
    const found = group.items.find((t) => t.value === value);
    if (found) return found;
  }
  return undefined;
}

export function getActionDef(value: string): ActionDef | undefined {
  for (const group of ACTIONS) {
    const found = group.items.find((a) => a.value === value);
    if (found) return found;
  }
  return undefined;
}
