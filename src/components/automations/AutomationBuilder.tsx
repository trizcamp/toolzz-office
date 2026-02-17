import { useState } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, Zap, ArrowDown, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAutomationSteps, type AutomationStep } from "@/hooks/useAutomations";
import type { Automation } from "@/hooks/useAutomations";
import { TRIGGERS, ACTIONS, getTriggerDef, getActionDef } from "./automationDefinitions";
import { toast } from "sonner";

interface Props {
  automation: Automation;
  onUpdate: (updates: Partial<Automation>) => void;
  onDelete: () => void;
}

export default function AutomationBuilder({ automation, onUpdate, onDelete }: Props) {
  const { steps, addStep, updateStep, deleteStep } = useAutomationSteps(automation.id);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [showTriggerConfig, setShowTriggerConfig] = useState(false);

  const triggerDef = getTriggerDef(automation.trigger_type);

  const handleAddStep = async (actionType: string) => {
    await addStep.mutateAsync({
      automation_id: automation.id,
      action_type: actionType,
      position: steps.length,
      action_config: {},
    });
    toast.success("Ação adicionada");
  };

  const handleDeleteStep = async (stepId: string) => {
    await deleteStep.mutateAsync(stepId);
    toast.success("Ação removida");
  };

  const handleUpdateStepConfig = async (stepId: string, config: Record<string, any>) => {
    await updateStep.mutateAsync({ id: stepId, action_config: config });
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <Input
            value={automation.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="text-lg font-semibold bg-transparent border-none px-0 h-auto focus-visible:ring-0 max-w-md"
          />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Ativa</Label>
              <Switch
                checked={automation.is_active}
                onCheckedChange={(v) => onUpdate({ is_active: v })}
              />
            </div>
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Textarea
          value={automation.description || ""}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Descrição da automação (opcional)..."
          className="resize-none h-10 text-xs bg-transparent border-none px-0 focus-visible:ring-0"
        />
      </div>

      {/* Flow */}
      <div className="px-6 py-8 flex flex-col items-center gap-0">
        {/* Trigger node */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div
            className={cn(
              "border rounded-xl overflow-hidden transition-colors",
              "bg-primary/5 border-primary/20"
            )}
          >
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              onClick={() => setShowTriggerConfig(!showTriggerConfig)}
            >
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                {triggerDef ? <triggerDef.icon className="w-5 h-5 text-primary" /> : <Zap className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quando...</p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {triggerDef?.label || "Selecione um gatilho"}
                </p>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showTriggerConfig && "rotate-180")} />
            </div>

            <AnimatePresence>
              {showTriggerConfig && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3 border-t border-primary/10 pt-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Gatilho</Label>
                      <Select
                        value={automation.trigger_type}
                        onValueChange={(v) => onUpdate({ trigger_type: v, trigger_config: {} })}
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRIGGERS.map((group) => (
                            <div key={group.category}>
                              <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                {group.category}
                              </div>
                              {group.items.map((t) => (
                                <SelectItem key={t.value} value={t.value} className="text-xs">
                                  <div className="flex items-center gap-2">
                                    <t.icon className="w-3.5 h-3.5" />
                                    {t.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {triggerDef?.configFields?.map((field) => (
                      <div key={field.key} className="space-y-1.5">
                        <Label className="text-xs">{field.label}</Label>
                        {field.type === "select" ? (
                          <Select
                            value={(automation.trigger_config as any)?.[field.key] || ""}
                            onValueChange={(v) =>
                              onUpdate({ trigger_config: { ...automation.trigger_config, [field.key]: v } })
                            }
                          >
                            <SelectTrigger className="text-xs"><SelectValue placeholder={field.placeholder} /></SelectTrigger>
                            <SelectContent>
                              {field.options?.map((o) => (
                                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={(automation.trigger_config as any)?.[field.key] || ""}
                            onChange={(e) =>
                              onUpdate({ trigger_config: { ...automation.trigger_config, [field.key]: e.target.value } })
                            }
                            placeholder={field.placeholder}
                            className="text-xs"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Steps */}
        {steps.map((step, i) => {
          const actionDef = getActionDef(step.action_type);
          const isExpanded = expandedStep === step.id;
          return (
            <div key={step.id} className="flex flex-col items-center w-full max-w-md">
              {/* Connector */}
              <div className="flex flex-col items-center py-1">
                <div className="w-px h-6 bg-border" />
                <ArrowDown className="w-3.5 h-3.5 text-muted-foreground -my-0.5" />
                <div className="w-px h-2 bg-border" />
              </div>

              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="w-full"
              >
                <div className="border border-border rounded-xl overflow-hidden bg-card hover:border-primary/20 transition-colors">
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                    onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", actionDef?.color || "bg-muted")}>
                      {actionDef ? <actionDef.icon className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{actionDef?.category || "Ação"}</p>
                      <p className="text-sm font-medium text-foreground truncate">{actionDef?.label || step.action_type}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={(e) => { e.stopPropagation(); handleDeleteStep(step.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-180")} />
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                          {actionDef?.configFields?.map((field) => (
                            <div key={field.key} className="space-y-1.5">
                              <Label className="text-xs">{field.label}</Label>
                              {field.type === "textarea" ? (
                                <Textarea
                                  value={(step.action_config as any)?.[field.key] || ""}
                                  onChange={(e) =>
                                    handleUpdateStepConfig(step.id, { ...step.action_config, [field.key]: e.target.value })
                                  }
                                  placeholder={field.placeholder}
                                  className="text-xs resize-none h-20"
                                />
                              ) : field.type === "select" ? (
                                <Select
                                  value={(step.action_config as any)?.[field.key] || ""}
                                  onValueChange={(v) =>
                                    handleUpdateStepConfig(step.id, { ...step.action_config, [field.key]: v })
                                  }
                                >
                                  <SelectTrigger className="text-xs"><SelectValue placeholder={field.placeholder} /></SelectTrigger>
                                  <SelectContent>
                                    {field.options?.map((o) => (
                                      <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  value={(step.action_config as any)?.[field.key] || ""}
                                  onChange={(e) =>
                                    handleUpdateStepConfig(step.id, { ...step.action_config, [field.key]: e.target.value })
                                  }
                                  placeholder={field.placeholder}
                                  className="text-xs"
                                />
                              )}
                            </div>
                          ))}
                          {(!actionDef?.configFields || actionDef.configFields.length === 0) && (
                            <p className="text-xs text-muted-foreground italic">Nenhuma configuração necessária para esta ação.</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          );
        })}

        {/* Add step button */}
        <div className="flex flex-col items-center py-1">
          <div className="w-px h-6 bg-border" />
          <div className="w-px h-2 bg-border" />
        </div>

        <AddStepDropdown onSelect={handleAddStep} />
      </div>
    </div>
  );
}

function AddStepDropdown({ onSelect }: { onSelect: (type: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full max-w-md">
      <Button
        variant="outline"
        className="w-full gap-2 border-dashed text-muted-foreground hover:text-foreground hover:border-primary/30"
        onClick={() => setOpen(!open)}
      >
        <Plus className="w-4 h-4" /> Adicionar ação
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-lg z-20 overflow-hidden max-h-[400px] overflow-y-auto"
          >
            {ACTIONS.map((group) => (
              <div key={group.category}>
                <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 sticky top-0">
                  {group.category}
                </div>
                {group.items.map((action) => (
                  <button
                    key={action.value}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent/50 transition-colors"
                    onClick={() => { onSelect(action.value); setOpen(false); }}
                  >
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", action.color)}>
                      <action.icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{action.label}</p>
                      <p className="text-[10px] text-muted-foreground">{action.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
