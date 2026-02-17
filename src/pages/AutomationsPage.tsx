import { useState } from "react";
import { Plus, Zap, MoreVertical, Trash2, Copy, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAutomations } from "@/hooks/useAutomations";
import { getTriggerDef } from "@/components/automations/automationDefinitions";
import AutomationBuilder from "@/components/automations/AutomationBuilder";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import makeIcon from "@/assets/make-icon.png";

export default function AutomationsPage() {
  const { automations, isLoading, createAutomation, updateAutomation, deleteAutomation } = useAutomations();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = automations.find((a) => a.id === selectedId) || null;

  const handleCreate = async () => {
    const result = await createAutomation.mutateAsync({
      name: "Nova Automação",
      trigger_type: "task_created",
      trigger_config: {},
    });
    setSelectedId(result.id);
    toast.success("Automação criada!");
  };

  const handleDelete = async (id: string) => {
    if (selectedId === id) setSelectedId(null);
    await deleteAutomation.mutateAsync(id);
    toast.success("Automação removida");
  };

  const handleDuplicate = async (auto: typeof automations[0]) => {
    await createAutomation.mutateAsync({
      name: auto.name + " (cópia)",
      trigger_type: auto.trigger_type,
      trigger_config: auto.trigger_config,
      description: auto.description,
    });
    toast.success("Automação duplicada");
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar - List */}
      <div className="w-[280px] shrink-0 border-r border-border bg-sidebar flex flex-col">
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center gap-2">
            <img src={makeIcon} alt="" className="w-5 h-5 rounded" />
            <h2 className="text-sm font-semibold text-foreground flex-1">Automações</h2>
          </div>
          <Button onClick={handleCreate} className="w-full gap-2 text-xs" size="sm" disabled={createAutomation.isPending}>
            <Plus className="w-3.5 h-3.5" /> Nova automação
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && automations.length === 0 && (
            <div className="text-center py-12 px-4">
              <Zap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma automação</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Crie sua primeira automação para automatizar fluxos</p>
            </div>
          )}

          <AnimatePresence>
            {automations.map((auto) => {
              const triggerDef = getTriggerDef(auto.trigger_type);
              const isSelected = selectedId === auto.id;
              return (
                <motion.div
                  key={auto.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <div
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group",
                      isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-accent/50 border border-transparent"
                    )}
                    onClick={() => setSelectedId(auto.id)}
                  >
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", auto.is_active ? "bg-emerald-500/15" : "bg-muted")}>
                      {auto.is_active ? <Power className="w-3.5 h-3.5 text-emerald-500" /> : <PowerOff className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{auto.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                        {triggerDef && <triggerDef.icon className="w-2.5 h-2.5 inline" />}
                        {triggerDef?.label || auto.trigger_type}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs">
                        <DropdownMenuItem onClick={() => handleDuplicate(auto)} className="text-xs gap-2">
                          <Copy className="w-3 h-3" /> Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(auto.id)} className="text-xs gap-2 text-destructive">
                          <Trash2 className="w-3 h-3" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Builder area */}
      {selected ? (
        <AutomationBuilder
          key={selected.id}
          automation={selected}
          onUpdate={(updates) => updateAutomation.mutate({ id: selected.id, ...updates })}
          onDelete={() => handleDelete(selected.id)}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="text-center space-y-3">
            <Zap className="w-16 h-16 text-muted-foreground/20 mx-auto" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Selecione ou crie uma automação</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Configure gatilhos e ações para automatizar seus fluxos</p>
            </div>
            <Button onClick={handleCreate} variant="outline" className="gap-2 text-xs" disabled={createAutomation.isPending}>
              <Plus className="w-3.5 h-3.5" /> Nova automação
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
