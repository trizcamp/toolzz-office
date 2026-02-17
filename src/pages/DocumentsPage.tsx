import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Plus, FileText, Link2, Maximize2, Minimize2, Folder, ChevronLeft, FileIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
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
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function DocumentsPage() {
  const { documents, isLoading, createDocument, updateDocument, deleteDocument } = useDocuments();
  const { boards } = useBoards();
  const { tasks: allTasks } = useTasks(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [newDocOpen, setNewDocOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocTaskId, setNewDocTaskId] = useState<string>("none");
  const [taskSearch, setTaskSearch] = useState("");
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);

  const deleteDocData = deleteDocId ? documents.find((d: any) => d.id === deleteDocId) : null;

  const selectedDoc = documents.find((d: any) => d.id === selectedDocId) || null;
  const { blocks: dbBlocks, saveBlocks } = useDocumentBlocks(selectedDocId);

  const [localBlocks, setLocalBlocks] = useState<Block[] | null>(null);
  const initializedDocRef = useRef<string | null>(null);

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

  // Group documents by board (via task.board_id)
  const { folderData, unlinkedDocs } = useMemo(() => {
    const boardMap = new Map<string, { board: any; docs: any[] }>();
    const unlinked: any[] = [];

    for (const doc of documents) {
      const boardId = (doc as any).tasks?.board_id;
      if (boardId) {
        if (!boardMap.has(boardId)) {
          const board = boards.find((b: any) => b.id === boardId);
          boardMap.set(boardId, { board: board || { id: boardId, name: "Board", icon: "📋" }, docs: [] });
        }
        boardMap.get(boardId)!.docs.push(doc);
      } else {
        unlinked.push(doc);
      }
    }

    return { folderData: Array.from(boardMap.values()), unlinkedDocs: unlinked };
  }, [documents, boards]);

  const activeFolderDocs = useMemo(() => {
    if (activeFolderId === "__unlinked") return unlinkedDocs;
    if (!activeFolderId) return [];
    return folderData.find((f) => f.board.id === activeFolderId)?.docs || [];
  }, [activeFolderId, folderData, unlinkedDocs]);

  const activeFolderName = useMemo(() => {
    if (activeFolderId === "__unlinked") return "Sem vínculo";
    if (!activeFolderId) return "";
    return folderData.find((f) => f.board.id === activeFolderId)?.board?.name || "Board";
  }, [activeFolderId, folderData]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleBlocksChange = useCallback((blocks: Block[]) => {
    if (!selectedDocId) return;
    setLocalBlocks(blocks);
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
          setTaskSearch("");
        },
      }
    );
  };

  const updateDocTitle = (title: string) => {
    if (!selectedDocId) return;
    updateDocument.mutate({ id: selectedDocId, title });
  };

  const handleDeleteDocument = () => {
    if (!deleteDocId) return;
    const hasTask = deleteDocData?.task_id;
    deleteDocument.mutate(deleteDocId, {
      onSuccess: () => {
        if (selectedDocId === deleteDocId) setSelectedDocId(null);
        setDeleteDocId(null);
        toast.success(hasTask ? "Documento apagado e desvinculado da tarefa" : "Documento apagado");
      },
    });
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

  const renderDocItem = (doc: any) => (
    <ContextMenu key={doc.id}>
      <ContextMenuTrigger asChild>
        <button
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
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteDocId(doc.id)}>
          <Trash2 className="w-3.5 h-3.5 mr-2" /> Apagar documento
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-border flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          {activeFolderId ? (
            <button
              onClick={() => { setActiveFolderId(null); setSelectedDocId(null); }}
              className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-muted-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="truncate">{activeFolderName}</span>
            </button>
          ) : (
            <h2 className="text-sm font-semibold text-foreground">Documentos</h2>
          )}
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setNewDocOpen(true)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {isLoading ? (
            <div className="space-y-2 p-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
          ) : activeFolderId ? (
            activeFolderDocs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum documento nesta pasta</p>
            ) : (
              activeFolderDocs.map(renderDocItem)
            )
          ) : (
            <>
              {folderData.length === 0 && unlinkedDocs.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum documento</p>
              )}
              {folderData.map(({ board, docs }) => (
                <button
                  key={board.id}
                  onClick={() => setActiveFolderId(board.id)}
                  className="w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover flex items-center gap-2.5"
                >
                  <Folder className="w-4 h-4 text-primary/70 shrink-0" />
                  <span className="truncate flex-1">{board.name}</span>
                  <span className="text-[10px] text-muted-foreground/60 shrink-0">{docs.length}</span>
                </button>
              ))}
              {unlinkedDocs.length > 0 && (
                <button
                  onClick={() => setActiveFolderId("__unlinked")}
                  className="w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover flex items-center gap-2.5"
                >
                  <FileIcon className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                  <span className="truncate flex-1">Sem vínculo</span>
                  <span className="text-[10px] text-muted-foreground/60 shrink-0">{unlinkedDocs.length}</span>
                </button>
              )}
            </>
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
        <DialogContent className="sm:max-w-[420px] overflow-hidden">
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar tarefa..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              <div className="max-h-48 overflow-y-auto border border-border rounded-lg bg-popover">
                <button
                  type="button"
                  onClick={() => setNewDocTaskId("none")}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm transition-colors",
                    newDocTaskId === "none" ? "bg-surface-hover text-foreground" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                  )}
                >
                  Nenhuma tarefa
                </button>
                {allTasks
                  .filter((t) => {
                    if (!taskSearch.trim()) return true;
                    const q = taskSearch.toLowerCase();
                    return t.title.toLowerCase().includes(q) || t.display_id.toLowerCase().includes(q);
                  })
                  .map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setNewDocTaskId(t.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm transition-colors border-t border-border",
                        newDocTaskId === t.id ? "bg-surface-hover text-foreground" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground shrink-0">{t.display_id}</span>
                        <span className="truncate">{t.title}</span>
                      </span>
                    </button>
                  ))}
              </div>
            </div>
            <Button className="w-full btn-gradient" onClick={handleCreateDocument}>
              Criar Documento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Document Confirmation */}
      <AlertDialog open={!!deleteDocId} onOpenChange={(open) => { if (!open) setDeleteDocId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDocData?.task_id
                ? "Este documento será apagado permanentemente. A tarefa vinculada será mantida, mas perderá o documento associado."
                : "Este documento será apagado permanentemente. Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDocument} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
