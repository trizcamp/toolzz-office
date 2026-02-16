import { Play, MessageSquare, Zap, Bot, Type, Image, Video, Code, Hash, Calendar, Globe, Mail, Phone, MousePointer } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const blockCategories = [
  {
    title: "Modelos de IA",
    icon: Bot,
    items: ["Open AI", "Open AI Custom", "Azure AI", "Anthropic", "HuggingChat", "Google Vertex AI", "ChatLocalAI"],
    pro: true,
  },
  {
    title: "Mensagens",
    icon: MessageSquare,
    items: [
      { label: "Textos", icon: Type },
      { label: "Imagens", icon: Image },
      { label: "Vídeos", icon: Video },
      { label: "Embed", icon: Code },
    ],
  },
  {
    title: "Inputs",
    icon: Zap,
    items: [
      { label: "Textos", icon: Type },
      { label: "Número", icon: Hash },
      { label: "Data", icon: Calendar },
      { label: "Website", icon: Globe },
      { label: "E-mail", icon: Mail },
      { label: "Telefone", icon: Phone },
      { label: "Botão", icon: MousePointer },
    ],
  },
  {
    title: "Lógica",
    icon: Zap,
    items: [],
  },
];

export default function AutomationsPage() {
  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* Sidebar - Blocos */}
      <div className="w-[240px] shrink-0 border-r border-border bg-sidebar p-4 overflow-y-auto space-y-5">
        <h2 className="text-sm font-semibold text-foreground">Blocos</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar"
            className="w-full bg-surface text-sm text-foreground placeholder:text-muted-foreground rounded-lg px-3 py-2 outline-none border border-border"
            readOnly
          />
        </div>

        {blockCategories.map((cat) => (
          <div key={cat.title} className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <span>{cat.title}</span>
              {cat.pro && (
                <Badge className="text-[9px] px-1.5 py-0 bg-primary/20 text-primary border-0">Pro</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {cat.items.map((item) => {
                const isObj = typeof item === "object";
                const label = isObj ? item.label : item;
                const Icon = isObj ? item.icon : Bot;
                return (
                  <div
                    key={label}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-surface border border-border text-[11px] text-muted-foreground cursor-default hover:border-primary/30 transition-colors"
                  >
                    <Icon className="w-3 h-3 shrink-0" />
                    <span className="truncate">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative overflow-auto p-8">
        <div className="flex flex-col items-center gap-2">
          {/* Start node */}
          <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-md">
            <Play className="w-4 h-4" /> Início do fluxo
          </div>

          <div className="w-px h-8 bg-border" />

          {/* First interaction node */}
          <div className="bg-card border border-border rounded-xl p-4 w-[280px] shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Primeira interação</p>
                <p className="text-[10px] text-muted-foreground">Mensagens</p>
              </div>
            </div>
            <div className="bg-surface rounded-lg px-3 py-2 text-xs text-secondary-foreground">
              Olá bom ter você aqui
            </div>
          </div>

          <div className="w-px h-8 bg-border" />

          {/* Buttons node */}
          <div className="bg-card border border-border rounded-xl p-4 w-[280px] shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent/30 flex items-center justify-center">
                <MousePointer className="w-4 h-4 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Botões</p>
                <p className="text-[10px] text-muted-foreground">Inputs</p>
              </div>
            </div>
            <div className="bg-surface rounded-lg px-3 py-2 text-xs text-secondary-foreground">
              Como podemos ajudar você?
            </div>
            <div className="flex flex-col gap-1.5">
              {["Como eu crio um curso?", "Como eu crio um conteúdo?", "Como eu crio uma aula?"].map((q) => (
                <span key={q} className="text-[11px] text-primary cursor-default text-right">{q}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Coming soon overlay */}
        <div className="absolute inset-0 flex items-end justify-center pb-8 pointer-events-none">
          <Badge variant="secondary" className="text-xs pointer-events-auto">
            Automações em breve
          </Badge>
        </div>
      </div>

      {/* Right panel - Chat preview */}
      <div className="w-[260px] shrink-0 border-l border-border bg-sidebar flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Boas vindas</p>
              <p className="text-[10px] text-muted-foreground">Como podemos ajudar?</p>
            </div>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Bot className="w-3 h-3 text-primary" />
            </div>
            <div className="bg-surface rounded-lg px-3 py-2 text-xs text-secondary-foreground max-w-[180px]">
              Olá, eu sou o Edu, a inteligência artificial do Toolzz.
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-xs max-w-[180px]">
              Como fazer o cálculo de Bhaskara?
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Bot className="w-3 h-3 text-primary" />
            </div>
            <div className="bg-surface rounded-lg px-3 py-2 text-xs text-secondary-foreground max-w-[180px]">
              Para realizar o cálculo de Bhaskara, você primeiro precisa encontrar o valor de Δ na equação ax² + bx + c = 0.
            </div>
          </div>
        </div>
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2">
            <input
              type="text"
              placeholder="Digitar..."
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );
}
