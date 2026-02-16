import { useState } from "react";
import { ArrowLeft, Github, Check, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useGithubIntegration } from "@/hooks/useGithubIntegration";
import makeIcon from "@/assets/make-icon.png";

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

export default function IntegrationsPage() {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const { connected, username, loading, startOAuth, disconnect } = useGithubIntegration();
  const { toast } = useToast();

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast({ title: "GitHub desconectado", description: "A integração foi removida." });
    } catch {
      toast({ title: "Erro", description: "Falha ao desconectar", variant: "destructive" });
    }
  };

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
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">GitHub</h2>
                <p className="text-sm text-muted-foreground">
                  {connected ? `Conectado como @${username}` : "Conecte sua conta GitHub"}
                </p>
              </div>
              {connected && (
                <Badge className="bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-0">
                  <Check className="w-3 h-3 mr-1" /> Conectado
                </Badge>
              )}
            </div>

            {connected ? (
              <div className="space-y-3">
                <p className="text-sm text-secondary-foreground">
                  Sua conta GitHub está conectada. Tarefas do tipo <strong>Bug</strong> ou <strong>Melhoria</strong> criarão automaticamente issues no repositório selecionado.
                </p>
                <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                  <Github className="w-4 h-4 text-foreground" />
                  <span className="text-sm text-foreground font-medium">@{username}</span>
                  <a
                    href={`https://github.com/${username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={handleDisconnect}>
                  <X className="w-4 h-4 mr-2" /> Desconectar GitHub
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-secondary-foreground">
                  Ao conectar o GitHub, você poderá vincular repositórios às tarefas. Tarefas do tipo Bug ou Melhoria criarão automaticamente issues no GitHub.
                </p>
                <Button
                  className="btn-gradient w-full"
                  onClick={startOAuth}
                >
                  <Github className="w-4 h-4 mr-2" />
                  Entrar com GitHub
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Integrações</h1>
        <p className="text-sm text-muted-foreground mt-1">Conecte suas ferramentas favoritas</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <div key={integration.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <IntegrationIcon type={integration.iconType} size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">{integration.name}</h3>
              </div>
              {integration.id === "github" && connected ? (
                <Badge className="text-[10px] bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-0">Conectado</Badge>
              ) : !integration.available ? (
                <Badge variant="secondary" className="text-[10px]">Em breve</Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">{integration.description}</p>
            <Button
              size="sm"
              className="w-full btn-gradient text-xs"
              disabled={!integration.available}
              onClick={() => integration.available && setSelectedIntegration(integration.id)}
            >
              {integration.id === "github" && connected ? "Gerenciar" : integration.available ? "Configurar" : "Em breve"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
