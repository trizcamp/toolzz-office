export interface MeetingParticipant {
  id: string;
  name: string;
}

export interface MeetingTask {
  id: string;
  title: string;
}

export interface TranscriptEntry {
  time: string;
  speaker: string;
  text: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  participants: MeetingParticipant[];
  tasks: MeetingTask[];
  transcript: TranscriptEntry[];
  summary: string;
}

export const mockMeetings: Meeting[] = [
  {
    id: "meet-1",
    title: "Daily Standup — Sprint 14",
    date: "2025-02-14",
    startTime: "09:00",
    endTime: "09:25",
    room: "Daily",
    participants: [
      { id: "1", name: "Beatriz F." },
      { id: "2", name: "João S." },
      { id: "3", name: "Rafael M." },
      { id: "4", name: "Amanda L." },
    ],
    tasks: [
      { id: "TOZ-108", title: "Fix: Notificações duplicadas" },
      { id: "TOZ-103", title: "Dashboard de métricas" },
    ],
    summary: "Equipe alinhou progresso do sprint. Beatriz reportou bloqueio no módulo de permissões. Rafael apresentou progresso no dashboard. Amanda identificou bug crítico de notificações duplicadas.",
    transcript: [
      { time: "09:00", speaker: "Amanda L.", text: "Bom dia pessoal! Vamos começar a daily. Beatriz, pode começar?" },
      { time: "09:01", speaker: "Beatriz F.", text: "Ontem trabalhei na refatoração do módulo de permissões. Estou com um bloqueio na parte de RBAC, preciso de ajuda do Rafael." },
      { time: "09:03", speaker: "Rafael M.", text: "Posso te ajudar depois da daily. Ontem avancei bastante no dashboard de métricas, já tenho os gráficos de uso funcionando." },
      { time: "09:05", speaker: "João S.", text: "Eu finalizei a correção do bug de upload. Já está na branch, preciso de review." },
      { time: "09:07", speaker: "Amanda L.", text: "Ótimo! Eu vou revisar. Ontem identifiquei um problema sério: as notificações estão sendo enviadas em duplicata. Vou priorizar isso hoje." },
      { time: "09:09", speaker: "Beatriz F.", text: "Isso explica os reports dos usuários. Bom que você pegou isso." },
      { time: "09:11", speaker: "Rafael M.", text: "Precisamos criar uma tarefa para isso. Amanda, você cria?" },
      { time: "09:12", speaker: "Amanda L.", text: "Já criei: TOZ-108. Marquei como crítica." },
      { time: "09:15", speaker: "Amanda L.", text: "Mais alguma coisa? Se não, vamos encerrar. Boa sprint pessoal!" },
    ],
  },
  {
    id: "meet-2",
    title: "Sprint Review — Sprint 13",
    date: "2025-02-10",
    startTime: "14:00",
    endTime: "15:10",
    room: "Sprint Review",
    participants: [
      { id: "1", name: "Beatriz F." },
      { id: "2", name: "João S." },
      { id: "3", name: "Rafael M." },
      { id: "5", name: "Thiago M." },
    ],
    tasks: [
      { id: "TOZ-101", title: "Implementar autenticação OAuth" },
      { id: "TOZ-110", title: "Tema escuro para emails" },
    ],
    summary: "Review do Sprint 13. Demonstração da autenticação OAuth (Beatriz) e tema escuro para emails (Thiago). Feedback positivo do time. Decisão de priorizar integração Slack no próximo sprint.",
    transcript: [
      { time: "14:00", speaker: "Rafael M.", text: "Vamos começar a review. Beatriz, pode demonstrar o OAuth?" },
      { time: "14:02", speaker: "Beatriz F.", text: "Claro! Implementei login com Google e GitHub. Vou compartilhar a tela." },
      { time: "14:05", speaker: "Beatriz F.", text: "Aqui está o fluxo: o usuário clica em 'Entrar com Google', é redirecionado, e volta autenticado. Funciona perfeitamente." },
      { time: "14:10", speaker: "João S.", text: "Ficou muito bom! E a parte de refresh token?" },
      { time: "14:12", speaker: "Beatriz F.", text: "Está implementado. O token renova automaticamente sem o usuário perceber." },
      { time: "14:20", speaker: "Thiago M.", text: "Minha vez! Fiz o tema escuro para os templates de email. Vou mostrar os antes e depois." },
      { time: "14:25", speaker: "Rafael M.", text: "Excelente trabalho, Thiago. Os emails ficaram muito mais profissionais." },
      { time: "14:30", speaker: "João S.", text: "Para o próximo sprint, sugiro priorizarmos a integração com Slack. Os clientes pedem muito." },
      { time: "14:35", speaker: "Rafael M.", text: "Concordo. Vamos colocar no backlog priorizado." },
    ],
  },
  {
    id: "meet-3",
    title: "Sessão de Mentoria — Frontend",
    date: "2025-02-07",
    startTime: "16:00",
    endTime: "16:45",
    room: "Sessão 1:1",
    participants: [
      { id: "1", name: "Beatriz F." },
      { id: "5", name: "Thiago M." },
    ],
    tasks: [
      { id: "TOZ-107", title: "Tela de onboarding" },
    ],
    summary: "Mentoria de Beatriz para Thiago sobre padrões de componentização React. Discussão sobre a tela de onboarding e boas práticas de estado.",
    transcript: [
      { time: "16:00", speaker: "Beatriz F.", text: "Thiago, hoje vamos falar sobre componentização. Vi que você está trabalhando no onboarding." },
      { time: "16:03", speaker: "Thiago M.", text: "Sim! Estou com dúvida sobre como dividir o wizard em componentes menores." },
      { time: "16:05", speaker: "Beatriz F.", text: "O ideal é ter um componente de Step que receba o conteúdo como children. Cada etapa vira um componente independente." },
      { time: "16:10", speaker: "Thiago M.", text: "Faz sentido. E o estado do wizard, fico gerenciando no pai?" },
      { time: "16:12", speaker: "Beatriz F.", text: "Exato. Um useReducer no componente pai controla o step atual e os dados coletados." },
      { time: "16:20", speaker: "Thiago M.", text: "Entendi! Vou refatorar seguindo esse padrão. Obrigado, Bia!" },
    ],
  },
];
