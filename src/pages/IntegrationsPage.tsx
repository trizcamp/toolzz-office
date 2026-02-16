import { useState } from "react";
import { ArrowLeft, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    return <img src={figmaIcon} alt="Figma" style={{ width: size, height: size }} className="object-contain" />;
  }
  if (type === "make") {
    return <img src={makeIcon} alt="Make" style={{ width: size, height: size }} className="object-contain" />;
  }
  return null;
}

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
    </div>
  );
}
