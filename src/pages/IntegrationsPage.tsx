import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const integrations = [
  {
    id: "github",
    name: "GitHub",
    description: "Conecte e sincronize seus repositórios para vincular tarefas a PRs e branches.",
    icon: "🐙",
    available: true,
  },
  {
    id: "gitlab",
    name: "GitLab",
    description: "Integre com seus projetos GitLab para rastreamento de código.",
    icon: "🦊",
    available: false,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Receba notificações de tarefas e reuniões diretamente no Slack.",
    icon: "💬",
    available: false,
  },
  {
    id: "figma",
    name: "Figma",
    description: "Vincule designs do Figma às suas tarefas e documentos.",
    icon: "🎨",
    available: false,
  },
];

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
              <span className="text-3xl">🐙</span>
              <div>
                <h2 className="text-lg font-semibold text-foreground">GitHub</h2>
                <p className="text-sm text-muted-foreground">Conecte sua conta GitHub</p>
              </div>
            </div>
            <p className="text-sm text-secondary-foreground">
              Ao conectar o GitHub, você poderá vincular repositórios às tarefas, visualizar branches e PRs diretamente na esteira, e selecionar repositórios ao criar novas tarefas.
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
              <span className="text-2xl">{integration.icon}</span>
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
