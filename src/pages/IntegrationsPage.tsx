import { useState } from "react";
import { ArrowLeft, Github, Play, MessageSquare, Zap, Bot, Type, Image, Video, Code, Hash, Calendar, Globe, Mail, Phone, MousePointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import makeIcon from "@/assets/make-icon.png";
import figmaIcon from "@/assets/figma-icon.png";

const integrations = [
  {
    id: "github",
    name: "GitHub",
    description: "Conecte e sincronize seus repositórios para vincular tarefas a PRs e branches.",
    iconType: "github" as const,
    available: true,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Receba notificações de tarefas e reuniões diretamente no Slack.",
    iconType: "slack" as const,
    available: false,
  },
  {
    id: "figma",
    name: "Figma",
    description: "Vincule designs do Figma às suas tarefas e documentos.",
    iconType: "figma" as const,
    available: false,
  },
  {
    id: "make",
    name: "Make",
    description: "Automatize fluxos de trabalho conectando suas ferramentas favoritas.",
    iconType: "make" as const,
    available: false,
  },
];

function IntegrationIcon({ type, size = 24 }: { type: string; size?: number }) {
  if (type === "github") {
    return <Github className="text-foreground" style={{ width: size, height: size }} />;
  }
  if (type === "slack") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
        <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
        <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.522 2.521 2.527 2.527 0 0 1-2.521-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.522 2.522v6.312z" fill="#2EB67D"/>
        <path d="M15.165 18.956a2.528 2.528 0 0 1 2.522 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.521-2.522v-2.522h2.521zm0-1.27a2.527 2.527 0 0 1-2.521-2.522 2.527 2.527 0 0 1 2.521-2.521h6.313A2.528 2.528 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.521h-6.313z" fill="#ECB22E"/>
      </svg>
    );
  }
  if (type === "figma") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M8 24c2.2 0 4-1.8 4-4v-4H8c-2.2 0-4 1.8-4 4s1.8 4 4 4z" fill="#0ACF83"/>
        <path d="M4 12c0-2.2 1.8-4 4-4h4v8H8c-2.2 0-4-1.8-4-4z" fill="#A259FF"/>
        <path d="M4 4c0-2.2 1.8-4 4-4h4v8H8C5.8 8 4 6.2 4 4z" fill="#F24E1E"/>
        <path d="M12 0h4c2.2 0 4 1.8 4 4s-1.8 4-4 4h-4V0z" fill="#FF7262"/>
        <path d="M20 12c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4 4 1.8 4 4z" fill="#1ABCFE"/>
      </svg>
    );
  }
  if (type === "make") {
    return <img src={makeIcon} alt="Make" style={{ width: size, height: size }} className="object-contain" />;
  }
  return null;
}

/* ----------- Flow Builder Preview (Automações) ----------- */

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

function AutomationsPreview() {
  return (
    <div className="flex h-full gap-0 overflow-hidden rounded-xl border border-border bg-card">
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
        {/* Flow nodes */}
        <div className="flex flex-col items-center gap-2">
          {/* Start node */}
          <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-md">
            <Play className="w-4 h-4" /> Início do fluxo
          </div>

          {/* Connector */}
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

          {/* Connector */}
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

/* ----------- Main Page ----------- */

export default function IntegrationsPage() {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  if (selectedIntegration === "github") {
    return (
      <div className="h-full overflow-y-auto p-6 space-y-6">
        <button
          onClick={() => setSelectedIntegration(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para integrações
        </button>

        <div className="max-w-lg">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <IntegrationIcon type="github" size={32} />
              <div>
                <h2 className="text-lg font-semibold text-foreground">GitHub</h2>
                <p className="text-sm text-muted-foreground">Conecte sua conta GitHub</p>
              </div>
            </div>
            <p className="text-sm text-secondary-foreground">
              Ao conectar o GitHub, você poderá vincular repositórios às tarefas, visualizar branches e PRs diretamente na Central de Tarefas, e selecionar repositórios ao criar novas tarefas.
            </p>
            <Button
              className="btn-gradient w-full"
              onClick={() => window.open("https://github.com", "_blank")}
            >
              Conectar com GitHub
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Tabs defaultValue="integrations" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-6 pb-0">
          <h1 className="text-lg font-semibold text-foreground">Integrações & Automações</h1>
          <p className="text-sm text-muted-foreground mt-1">Conecte ferramentas e automatize fluxos</p>
          <TabsList className="mt-4">
            <TabsTrigger value="integrations">Integrações</TabsTrigger>
            <TabsTrigger value="automations">Automações</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="integrations" className="flex-1 overflow-y-auto px-6 pb-6 mt-0">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            {integrations.map((integration) => (
              <div key={integration.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    <IntegrationIcon type={integration.iconType} size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground">{integration.name}</h3>
                  </div>
                  {!integration.available && (
                    <Badge variant="secondary" className="text-[10px]">Em breve</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{integration.description}</p>
                <Button
                  size="sm"
                  className="w-full btn-gradient text-xs"
                  disabled={!integration.available}
                  onClick={() => integration.available && setSelectedIntegration(integration.id)}
                >
                  {integration.available ? "Configurar" : "Em breve"}
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="automations" className="flex-1 overflow-hidden px-6 pb-6 mt-0">
          <div className="h-full pt-4">
            <AutomationsPreview />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
