import { useState, useMemo } from "react";
import { Plus, FileText, Link2, MessageSquare, X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { typeLabelsDoc } from "@/data/mockDocuments";
import type { Block } from "@/data/mockDocuments";
import BlockEditor from "@/components/documents/BlockEditor";
import { AnimatePresence, motion } from "framer-motion";
import { useDocuments, useDocumentBlocks, useDocumentComments } from "@/hooks/useDocuments";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback, useRef, useEffect } from "react";

export default function DocumentsPage() {
  const { documents, isLoading, createDocument, updateDocument } = useDocuments();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const selectedDoc = documents.find((d: any) => d.id === selectedDocId) || null;
  const { blocks: dbBlocks, saveBlocks } = useDocumentBlocks(selectedDocId);
  const { comments } = useDocumentComments(selectedDocId);

  // Convert db blocks to editor format
  const editorBlocks: Block[] = useMemo(() => {
    if (dbBlocks.length === 0) return [{ id: "new_b1", type: "heading1" as const, content: "" }];
    return dbBlocks.map((b) => ({
      id: b.id,
      type: b.type as Block["type"],
      content: b.content || "",
      checked: b.checked || undefined,
      metadata: b.metadata || undefined,
    }));
  }, [dbBlocks]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleBlocksChange = useCallback((blocks: Block[]) => {
    if (!selectedDocId) return;
    // Debounce save
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
    }, 1000);
  }, [selectedDocId, saveBlocks]);

  const createNewDocument = () => {
    createDocument.mutate(
      { title: "Sem título", icon: "📄", type: "doc" },
      { onSuccess: (data) => { setSelectedDocId(data.id); setFullscreen(false); } }
    );
  };

  const updateDocTitle = (title: string) => {
    if (!selectedDocId) return;
    updateDocument.mutate({ id: selectedDocId, title });
  };

  if (fullscreen && selectedDoc) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-6 py-3 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-lg">{selectedDoc.icon}</span>
            <input className="text-lg font-semibold text-foreground bg-transparent border-none outline-none" value={selectedDoc.title} onChange={(e) => updateDocTitle(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={() => setShowComments(!showComments)}>
              <MessageSquare className="w-3.5 h-3.5" /> Comentários ({comments.length})
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setFullscreen(false)}>
              <Minimize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto px-8 py-6 max-w-4xl mx-auto w-full">
            <BlockEditor blocks={editorBlocks} onChange={handleBlocksChange} />
          </div>
          <AnimatePresence>
            {showComments && (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="border-l border-border bg-sidebar overflow-y-auto shrink-0">
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Comentários</h3>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowComments(false)}><X className="w-3.5 h-3.5" /></Button>
                  </div>
                  {comments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum comentário ainda.</p>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((c: any) => (
                        <div key={c.id} className="space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-medium text-foreground">{c.members?.name || "Anônimo"}</span>
                            <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</span>
                          </div>
                          <p className="text-sm text-secondary-foreground">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={createNewDocument}>
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
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={() => setShowComments(!showComments)}>
                  <MessageSquare className="w-3.5 h-3.5" /> {comments.length}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setFullscreen(true)}>
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <BlockEditor blocks={editorBlocks} onChange={handleBlocksChange} />
              </div>
              <AnimatePresence>
                {showComments && (
                  <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="border-l border-border bg-sidebar overflow-y-auto shrink-0">
                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">Comentários</h3>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowComments(false)}><X className="w-3.5 h-3.5" /></Button>
                      </div>
                      {comments.map((c: any) => (
                        <div key={c.id} className="space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-medium text-foreground">{c.members?.name || "Anônimo"}</span>
                            <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</span>
                          </div>
                          <p className="text-sm text-secondary-foreground">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">Selecione um documento ou crie um novo</p>
              <Button size="sm" className="btn-gradient" onClick={createNewDocument}>
                <Plus className="w-4 h-4 mr-1.5" /> Novo Documento
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
