import { useState } from "react";
import { Plus, FileText, Link2, MessageSquare, X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { mockDocuments, typeLabelsDoc, type Document, type Block } from "@/data/mockDocuments";
import BlockEditor from "@/components/documents/BlockEditor";
import { AnimatePresence, motion } from "framer-motion";

function generateId() {
  return "doc_" + Math.random().toString(36).substring(2, 9);
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const selectedDoc = documents.find((d) => d.id === selectedDocId) || null;

  const createNewDocument = () => {
    const newDoc: Document = {
      id: generateId(),
      title: "Sem título",
      icon: "📄",
      type: "doc",
      updatedAt: new Date().toISOString().split("T")[0],
      blocks: [{ id: "new_b1", type: "heading1", content: "" }],
      comments: [],
    };
    setDocuments([newDoc, ...documents]);
    setSelectedDocId(newDoc.id);
    setFullscreen(false);
  };

  const updateDocBlocks = (blocks: Block[]) => {
    if (!selectedDocId) return;
    setDocuments(documents.map((d) =>
      d.id === selectedDocId ? { ...d, blocks } : d
    ));
  };

  const updateDocTitle = (title: string) => {
    if (!selectedDocId) return;
    setDocuments(documents.map((d) =>
      d.id === selectedDocId ? { ...d, title } : d
    ));
  };

  if (fullscreen && selectedDoc) {
    return (
      <div className="h-full flex flex-col">
        {/* Fullscreen toolbar */}
        <div className="px-6 py-3 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-lg">{selectedDoc.icon}</span>
            <input
              className="text-lg font-semibold text-foreground bg-transparent border-none outline-none"
              value={selectedDoc.title}
              onChange={(e) => updateDocTitle(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={() => setShowComments(!showComments)}>
              <MessageSquare className="w-3.5 h-3.5" /> Comentários ({selectedDoc.comments.length})
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setFullscreen(false)}>
              <Minimize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto px-8 py-6 max-w-4xl mx-auto w-full">
            <BlockEditor blocks={selectedDoc.blocks} onChange={updateDocBlocks} />
          </div>
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-l border-border bg-sidebar overflow-y-auto shrink-0"
              >
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Comentários</h3>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowComments(false)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {selectedDoc.comments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum comentário ainda.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedDoc.comments.map((c) => (
                        <div key={c.id} className="space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-medium text-foreground">{c.author}</span>
                            <span className="text-[10px] text-muted-foreground">{c.createdAt}</span>
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
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => { setSelectedDocId(doc.id); setFullscreen(false); }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg transition-colors text-sm",
                selectedDocId === doc.id
                  ? "bg-surface-hover text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{doc.icon}</span>
                <span className="truncate flex-1">{doc.title}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 ml-6">
                <Badge variant="secondary" className="text-[9px] px-1 py-0">{typeLabelsDoc[doc.type]}</Badge>
                {doc.taskId && (
                  <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                    <Link2 className="w-2.5 h-2.5" />{doc.taskId}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedDoc ? (
          <>
            {/* Doc header */}
            <div className="px-6 py-3 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg">{selectedDoc.icon}</span>
                <input
                  className="text-lg font-semibold text-foreground bg-transparent border-none outline-none min-w-0 flex-1"
                  value={selectedDoc.title}
                  onChange={(e) => updateDocTitle(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {selectedDoc.taskId && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Link2 className="w-3 h-3" />{selectedDoc.taskId}
                  </Badge>
                )}
                <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={() => setShowComments(!showComments)}>
                  <MessageSquare className="w-3.5 h-3.5" /> {selectedDoc.comments.length}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setFullscreen(true)}>
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Editor */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <BlockEditor blocks={selectedDoc.blocks} onChange={updateDocBlocks} />
              </div>
              {/* Comments panel */}
              <AnimatePresence>
                {showComments && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 300, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="border-l border-border bg-sidebar overflow-y-auto shrink-0"
                  >
                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">Comentários</h3>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setShowComments(false)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      {selectedDoc.comments.map((c) => (
                        <div key={c.id} className="space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-medium text-foreground">{c.author}</span>
                            <span className="text-[10px] text-muted-foreground">{c.createdAt}</span>
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
