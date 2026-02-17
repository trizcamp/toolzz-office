import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Plus, FileText, Link2, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { typeLabelsDoc } from "@/data/mockDocuments";
import type { Block } from "@/data/mockDocuments";
import BlockEditor from "@/components/documents/BlockEditor";
import { useDocuments, useDocumentBlocks } from "@/hooks/useDocuments";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks } from "@/hooks/useTasks";
import { useBoards } from "@/hooks/useBoards";

export default function DocumentsPage() {
  const { documents, isLoading, createDocument, updateDocument } = useDocuments();
  const { boards } = useBoards();
  const { tasks: allTasks } = useTasks(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [newDocOpen, setNewDocOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocTaskId, setNewDocTaskId] = useState<string>("none");

  const selectedDoc = documents.find((d: any) => d.id === selectedDocId) || null;
  const { blocks: dbBlocks, saveBlocks } = useDocumentBlocks(selectedDocId);

  // Local block state — initialized from DB, not overwritten on refetch
  const [localBlocks, setLocalBlocks] = useState<Block[] | null>(null);
  const initializedDocRef = useRef<string | null>(null);

  // Initialize local blocks when selecting a new document or when DB blocks first load
  useEffect(() => {
    if (!selectedDocId) {
      setLocalBlocks(null);
      initializedDocRef.current = null;
      defaultBlock.current = [{ id: crypto.randomUUID(), type: "heading2" as const, content: "" }];
      return;
    }
    if (selectedDocId !== initializedDocRef.current && dbBlocks.length > 0) {
      initializedDocRef.current = selectedDocId;
      setLocalBlocks(
        dbBlocks.map((b) => ({
          id: b.id,
          type: b.type as Block["type"],
          content: b.content || "",
          checked: b.checked || undefined,
          metadata: b.metadata || undefined,
        }))
      );
    }
  }, [selectedDocId, dbBlocks]);

  const defaultBlock = useRef<Block[]>([{ id: crypto.randomUUID(), type: "heading2" as const, content: "" }]);

  const editorBlocks: Block[] = useMemo(() => {
    if (localBlocks && localBlocks.length > 0) return localBlocks;
    if (dbBlocks.length > 0) {
      return dbBlocks.map((b) => ({
        id: b.id,
        type: b.type as Block["type"],
        content: b.content || "",
        checked: b.checked || undefined,
        metadata: b.metadata || undefined,
      }));
    }
    return defaultBlock.current;
  }, [localBlocks, dbBlocks]);

  const tasksWithoutDoc = useMemo(() => {
    const docTaskIds = new Set(documents.filter((d: any) => d.task_id).map((d: any) => d.task_id));
    return allTasks.filter((t) => !docTaskIds.has(t.id));
  }, [allTasks, documents]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleBlocksChange = useCallback((blocks: Block[]) => {
    if (!selectedDocId) return;
    // Update local state immediately
    setLocalBlocks(blocks);
    // Debounced save to DB
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveBlocks.mutate({
        documentId: selectedDocId,
        blocks: blocks.map((b, i) => ({
          id: b.id,
          document_id: selectedDocId,
          type: b.type,
          content: b.content,
          position: i,
          checked: b.checked || false,
          metadata: b.metadata || {},
        })),
      });
    }, 800);
  }, [selectedDocId, saveBlocks]);

  const handleCreateDocument = () => {
    const taskId = newDocTaskId !== "none" ? newDocTaskId : undefined;
    const task = taskId ? allTasks.find((t) => t.id === taskId) : null;
    const title = newDocTitle.trim() || (task ? task.title : "Sem título");

    createDocument.mutate(
      { title, icon: taskId ? "📋" : "📄", type: taskId ? "spec" : "doc", task_id: taskId },
      {
        onSuccess: (data) => {
          if (taskId) {
            import("@/integrations/supabase/client").then(({ supabase }) => {
              supabase.from("tasks").update({ document_id: data.id }).eq("id", taskId);
            });
          }
          setSelectedDocId(data.id);
          setFullscreen(true);
          setNewDocOpen(false);
          setNewDocTitle("");
          setNewDocTaskId("none");
        },
      }
    );
  };

  const updateDocTitle = (title: string) => {
    if (!selectedDocId) return;
    updateDocument.mutate({ id: selectedDocId, title });
  };

  // Fullscreen view
  if (fullscreen && selectedDoc) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-6 py-3 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-lg">{selectedDoc.icon}</span>
            <input className="text-lg font-semibold text-foreground bg-transparent border-none outline-none" value={selectedDoc.title} onChange={(e) => updateDocTitle(e.target.value)} />
            {selectedDoc.tasks && (
              <Badge variant="outline" className="text-[9px] gap-1">
                <Link2 className="w-2.5 h-2.5" />{selectedDoc.tasks?.display_id}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setFullscreen(false)}>
              <Minimize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6 max-w-4xl mx-auto w-full">
          <BlockEditor blocks={editorBlocks} onChange={handleBlocksChange} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Sidebar - doc list */}
      <div className="w-64 border-r border-border flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Documentos</h2>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setNewDocOpen(true)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {isLoading ? (
            <div className="space-y-2 p-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
          ) : documents.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum documento</p>
          ) : (
            documents.map((doc: any) => (
              <button
                key={doc.id}
                onClick={() => { setSelectedDocId(doc.id); setFullscreen(false); }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg transition-colors text-sm",
                  selectedDocId === doc.id ? "bg-surface-hover text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{doc.icon}</span>
                  <span className="truncate flex-1">{doc.title}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 ml-6">
                  <Badge variant="secondary" className="text-[9px] px-1 py-0">{typeLabelsDoc[doc.type]}</Badge>
                  {doc.tasks && (
                    <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                      <Link2 className="w-2.5 h-2.5" />{doc.tasks?.display_id}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedDoc ? (
          <>
            <div className="px-6 py-3 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg">{selectedDoc.icon}</span>
                <input className="text-lg font-semibold text-foreground bg-transparent border-none outline-none min-w-0 flex-1" value={selectedDoc.title} onChange={(e) => updateDocTitle(e.target.value)} />
                {selectedDoc.tasks && (
                  <Badge variant="outline" className="text-[9px] gap-1 shrink-0">
                    <Link2 className="w-2.5 h-2.5" />{selectedDoc.tasks?.display_id}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setFullscreen(true)}>
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <BlockEditor blocks={editorBlocks} onChange={handleBlocksChange} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">Selecione um documento ou crie um novo</p>
              <Button size="sm" className="btn-gradient" onClick={() => setNewDocOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Novo Documento
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Document Dialog */}
      <Dialog open={newDocOpen} onOpenChange={setNewDocOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Novo Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input placeholder="Nome do documento" value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Vincular a uma tarefa (opcional)</Label>
              <Select value={newDocTaskId} onValueChange={setNewDocTaskId}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Nenhuma tarefa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma tarefa</SelectItem>
                  {tasksWithoutDoc.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">{t.display_id}</span>
                        <span>{t.title}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full btn-gradient" onClick={handleCreateDocument}>
              Criar Documento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
