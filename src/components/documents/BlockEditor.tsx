import { useState, useCallback, useRef, useEffect, KeyboardEvent, memo } from "react";
import type { Block, BlockType } from "@/data/mockDocuments";
import SlashCommandMenu from "./SlashCommandMenu";
import { cn } from "@/lib/utils";
import { GripVertical, Plus, Trash2, Copy, ChevronRight, ImageIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Uncontrolled contentEditable — only updates DOM when html changes externally
const EditableDiv = memo(function EditableDiv({
  html,
  className,
  style,
  placeholder,
  onInput,
  onKeyDown,
  blockRef,
  readOnly,
}: {
  html: string;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  onInput: (el: HTMLElement) => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  blockRef?: (el: HTMLElement | null) => void;
  readOnly?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lastHtml = useRef(html);

  useEffect(() => {
    if (ref.current && html !== lastHtml.current) {
      ref.current.innerHTML = html;
      lastHtml.current = html;
    }
  }, [html]);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = html;
      lastHtml.current = html;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={(el) => {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        blockRef?.(el);
      }}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      dir="ltr"
      style={style}
      className={className}
      data-placeholder={placeholder}
      onInput={(e) => {
        lastHtml.current = e.currentTarget.innerHTML;
        onInput(e.currentTarget);
      }}
      onKeyDown={onKeyDown}
    />
  );
});

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  readOnly?: boolean;
}

const CODE_LANGUAGES = [
  "typescript", "javascript", "python", "sql", "java", "csharp", "go", "rust",
  "php", "ruby", "html", "css", "json", "yaml", "bash", "markdown",
];

const LANG_COLORS: Record<string, string> = {
  typescript: "text-blue-400",
  javascript: "text-yellow-400",
  python: "text-green-400",
  sql: "text-orange-400",
  java: "text-red-400",
  csharp: "text-purple-400",
  go: "text-cyan-400",
  rust: "text-orange-300",
  php: "text-indigo-400",
  ruby: "text-red-300",
  html: "text-orange-500",
  css: "text-blue-300",
  json: "text-yellow-300",
  yaml: "text-green-300",
  bash: "text-gray-400",
  markdown: "text-muted-foreground",
};

function generateId() {
  return crypto.randomUUID();
}

export default function BlockEditor({ blocks, onChange, readOnly = false }: BlockEditorProps) {
  const [slashMenu, setSlashMenu] = useState<{ blockId: string; position: { top: number; left: number }; filter: string } | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const blockRefs = useRef<Record<string, HTMLElement | null>>({});
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [pendingImageBlockId, setPendingImageBlockId] = useState<string | null>(null);

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }, [blocks, onChange]);

  const addBlockAfter = useCallback((afterId: string, type: BlockType = "paragraph") => {
    const newBlock: Block = { id: generateId(), type, content: "" };
    const idx = blocks.findIndex((b) => b.id === afterId);
    const next = [...blocks];
    next.splice(idx + 1, 0, newBlock);
    onChange(next);

    if (type === "image") {
      setPendingImageBlockId(newBlock.id);
      setTimeout(() => imageInputRef.current?.click(), 50);
    } else {
      setTimeout(() => blockRefs.current[newBlock.id]?.focus(), 10);
    }
  }, [blocks, onChange]);

  const deleteBlock = useCallback((id: string) => {
    if (blocks.length <= 1) return;
    const idx = blocks.findIndex((b) => b.id === id);
    const prevId = idx > 0 ? blocks[idx - 1].id : null;
    onChange(blocks.filter((b) => b.id !== id));
    if (prevId) setTimeout(() => blockRefs.current[prevId]?.focus(), 10);
  }, [blocks, onChange]);

  const duplicateBlock = useCallback((id: string) => {
    const idx = blocks.findIndex((b) => b.id === id);
    const dup = { ...blocks[idx], id: generateId() };
    const next = [...blocks];
    next.splice(idx + 1, 0, dup);
    onChange(next);
  }, [blocks, onChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLElement>, block: Block) => {
    if (e.key === "Enter" && !e.shiftKey && block.type !== "code") {
      e.preventDefault();
      if (slashMenu) return;
      addBlockAfter(block.id);
    }
    if (e.key === "Backspace" && block.content === "" && blocks.length > 1) {
      e.preventDefault();
      deleteBlock(block.id);
    }
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b") { e.preventDefault(); document.execCommand("bold"); }
      if (e.key === "i") { e.preventDefault(); document.execCommand("italic"); }
      if (e.key === "u") { e.preventDefault(); document.execCommand("underline"); }
    }
  }, [addBlockAfter, deleteBlock, blocks.length, slashMenu]);

  const handleInput = useCallback((blockId: string, el: HTMLElement) => {
    const text = el.innerText;
    if (text === "# ") { updateBlock(blockId, { type: "heading1", content: "" }); el.innerText = ""; return; }
    if (text === "## ") { updateBlock(blockId, { type: "heading2", content: "" }); el.innerText = ""; return; }
    if (text === "### ") { updateBlock(blockId, { type: "heading3", content: "" }); el.innerText = ""; return; }
    if (text === "* " || text === "- ") { updateBlock(blockId, { type: "bulletList", content: "" }); el.innerText = ""; return; }
    if (text === "1. ") { updateBlock(blockId, { type: "numberedList", content: "" }); el.innerText = ""; return; }
    if (text === "> ") { updateBlock(blockId, { type: "quote", content: "" }); el.innerText = ""; return; }
    if (text === "[] " || text === "[ ] ") { updateBlock(blockId, { type: "todoList", content: "" }); el.innerText = ""; return; }
    if (text.startsWith("```")) { updateBlock(blockId, { type: "code", content: "", metadata: { language: "typescript" } }); el.innerText = ""; return; }
    if (text === "--- ") { updateBlock(blockId, { type: "divider", content: "" }); el.innerText = ""; return; }

    if (text.startsWith("/")) {
      const rect = el.getBoundingClientRect();
      setSlashMenu({ blockId, position: { top: rect.bottom + 4, left: rect.left }, filter: text.slice(1) });
    } else if (slashMenu?.blockId === blockId) {
      setSlashMenu(null);
    }

    updateBlock(blockId, { content: el.innerHTML });
  }, [updateBlock, slashMenu]);

  const handleSlashSelect = useCallback((type: BlockType) => {
    if (!slashMenu) return;
    if (type === "image") {
      updateBlock(slashMenu.blockId, { type: "image", content: "" });
      setPendingImageBlockId(slashMenu.blockId);
      setSlashMenu(null);
      setTimeout(() => imageInputRef.current?.click(), 50);
      return;
    }
    updateBlock(slashMenu.blockId, { type, content: "" });
    setSlashMenu(null);
    setTimeout(() => blockRefs.current[slashMenu.blockId]?.focus(), 10);
  }, [slashMenu, updateBlock]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingImageBlockId) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateBlock(pendingImageBlockId, { content: reader.result as string });
      setPendingImageBlockId(null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;
  };
  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const from = blocks.findIndex((b) => b.id === draggedId);
    const to = blocks.findIndex((b) => b.id === targetId);
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
    setDraggedId(null);
  };

  const renderBlock = (block: Block, index: number) => {
  const baseClasses = "outline-none w-full";
  const ltrStyle = { textAlign: "left" as const, direction: "ltr" as const };

    const typeClasses: Record<string, string> = {
      heading1: "text-2xl font-bold text-foreground",
      heading2: "text-xl font-semibold text-foreground",
      heading3: "text-lg font-medium text-foreground",
      paragraph: "text-sm text-secondary-foreground leading-relaxed",
      bulletList: "text-sm text-secondary-foreground pl-4 before:content-['•'] before:absolute before:-left-0 before:text-muted-foreground relative",
      numberedList: `text-sm text-secondary-foreground pl-6 before:content-['${index + 1}.'] before:absolute before:-left-0 before:text-muted-foreground relative`,
      quote: "text-sm text-secondary-foreground italic border-l-2 border-primary/50 pl-4",
      code: "text-sm font-mono bg-muted/50 rounded-lg p-3 text-foreground whitespace-pre-wrap",
      callout: "text-sm text-secondary-foreground bg-primary/5 border border-primary/10 rounded-lg p-3",
      todoList: "text-sm text-secondary-foreground",
      toggle: "text-sm text-secondary-foreground",
      divider: "",
      image: "",
    };

    if (block.type === "divider") {
      return (
        <div key={block.id} className="py-2">
          <hr className="border-border" />
        </div>
      );
    }

    if (block.type === "image") {
      return (
        <div key={block.id} className="py-2">
          {block.content ? (
            <img src={block.content} alt="Imagem" className="max-w-full rounded-lg border border-border" />
          ) : (
            <button
              onClick={() => { setPendingImageBlockId(block.id); imageInputRef.current?.click(); }}
              className="w-full py-8 border-2 border-dashed border-border rounded-lg flex flex-col items-center gap-2 text-muted-foreground hover:border-muted-foreground/50 transition-colors"
            >
              <ImageIcon className="w-6 h-6" />
              <span className="text-xs">Clique para fazer upload de imagem</span>
            </button>
          )}
        </div>
      );
    }

    if (block.type === "todoList") {
      return (
        <div key={block.id} className="flex items-start gap-2 group">
          <input
            type="checkbox"
            checked={block.checked ?? false}
            onChange={(e) => updateBlock(block.id, { checked: e.target.checked })}
            className="mt-1 accent-primary"
            disabled={readOnly}
          />
          <EditableDiv
            blockRef={(el) => { blockRefs.current[block.id] = el; }}
            readOnly={readOnly}
            style={ltrStyle}
            html={block.content}
            className={cn(baseClasses, typeClasses[block.type], block.checked && "line-through text-muted-foreground")}
            onInput={(el) => handleInput(block.id, el)}
            onKeyDown={(e) => handleKeyDown(e, block)}
          />
        </div>
      );
    }

    if (block.type === "toggle") {
      const isCollapsed = block.metadata?.collapsed !== false;
      return (
        <div key={block.id}>
          <div className="flex items-start gap-1">
            <button
              onClick={() => updateBlock(block.id, { metadata: { ...block.metadata, collapsed: !isCollapsed } })}
              className="mt-0.5 text-muted-foreground hover:text-foreground transition-transform"
            >
              <ChevronRight className={cn("w-4 h-4 transition-transform", !isCollapsed && "rotate-90")} />
            </button>
            <EditableDiv
              blockRef={(el) => { blockRefs.current[block.id] = el; }}
              readOnly={readOnly}
              style={ltrStyle}
              html={block.content}
              className={cn(baseClasses, "text-sm font-medium text-foreground")}
              onInput={(el) => handleInput(block.id, el)}
              onKeyDown={(e) => handleKeyDown(e, block)}
            />
          </div>
        </div>
      );
    }

    if (block.type === "callout") {
      return (
        <div key={block.id} className={typeClasses.callout}>
          <div className="flex items-start gap-2">
            <span className="text-sm">{block.metadata?.icon || "💡"}</span>
            <EditableDiv
              blockRef={(el) => { blockRefs.current[block.id] = el; }}
              readOnly={readOnly}
              style={ltrStyle}
              html={block.content}
              className={cn(baseClasses, "text-sm text-secondary-foreground")}
              onInput={(el) => handleInput(block.id, el)}
              onKeyDown={(e) => handleKeyDown(e, block)}
            />
          </div>
        </div>
      );
    }

    if (block.type === "code") {
      const lang = block.metadata?.language || "typescript";
      return (
        <div key={block.id} className="relative">
          <div className="absolute top-2 right-2 z-10">
            {!readOnly ? (
              <Select
                value={lang}
                onValueChange={(v) => updateBlock(block.id, { metadata: { ...block.metadata, language: v } })}
              >
                <SelectTrigger className="h-5 text-[9px] border-0 bg-transparent px-1 w-auto min-w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CODE_LANGUAGES.map((l) => (
                    <SelectItem key={l} value={l}>
                      <span className={LANG_COLORS[l] || ""}>{l}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className={cn("text-[9px] uppercase tracking-wider", LANG_COLORS[lang] || "text-muted-foreground")}>{lang}</span>
            )}
          </div>
          <EditableDiv
            blockRef={(el) => { blockRefs.current[block.id] = el; }}
            readOnly={readOnly}
            style={ltrStyle}
            html={block.content}
            className={cn(baseClasses, typeClasses.code)}
            onInput={(el) => handleInput(block.id, el)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                document.execCommand("insertLineBreak");
              }
              if (e.key === "Backspace" && block.content === "" && blocks.length > 1) {
                e.preventDefault();
                deleteBlock(block.id);
              }
            }}
          />
        </div>
      );
    }

    return (
      <EditableDiv
        key={block.id}
        blockRef={(el) => { blockRefs.current[block.id] = el; }}
        readOnly={readOnly}
        style={ltrStyle}
        html={block.content}
        className={cn(baseClasses, typeClasses[block.type])}
        placeholder={block.content === "" ? "Escreva algo ou digite '/' para comandos" : undefined}
        onInput={(el) => handleInput(block.id, el)}
        onKeyDown={(e) => handleKeyDown(e, block)}
      />
    );
  };

  return (
    <div className="space-y-1">
      {/* Hidden image input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {blocks.map((block, index) => (
        <div
          key={block.id}
          className={cn(
            "group flex items-start gap-1 py-0.5 rounded transition-colors",
            draggedId === block.id && "opacity-40"
          )}
          draggable={!readOnly}
          onDragStart={() => handleDragStart(block.id)}
          onDragOver={(e) => handleDragOver(e, block.id)}
          onDrop={() => handleDrop(block.id)}
          onDragEnd={() => setDraggedId(null)}
        >
          {!readOnly && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-0.5">
              <button
                onClick={() => addBlockAfter(blocks[index - 1]?.id || block.id, "paragraph")}
                className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground rounded hover:bg-surface-hover"
              >
                <Plus className="w-3 h-3" />
              </button>
              <div className="cursor-grab text-muted-foreground hover:text-foreground">
                <GripVertical className="w-3.5 h-3.5" />
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            {renderBlock(block, index)}
          </div>
          {!readOnly && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-0.5">
              <button onClick={() => duplicateBlock(block.id)} className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground rounded hover:bg-surface-hover">
                <Copy className="w-3 h-3" />
              </button>
              <button onClick={() => deleteBlock(block.id)} className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-destructive rounded hover:bg-surface-hover">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      ))}

      {slashMenu && (
        <SlashCommandMenu
          position={slashMenu.position}
          filter={slashMenu.filter}
          onSelect={handleSlashSelect}
          onClose={() => setSlashMenu(null)}
        />
      )}

      <style>{`
        [data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: hsl(0 0% 35%);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
