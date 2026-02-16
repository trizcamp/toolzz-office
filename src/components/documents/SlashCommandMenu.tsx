import { useState, useEffect, useRef } from "react";
import type { BlockType } from "@/data/mockDocuments";

interface SlashCommandMenuProps {
  position: { top: number; left: number };
  onSelect: (type: BlockType) => void;
  onClose: () => void;
  filter: string;
}

const commands: { type: BlockType; label: string; icon: string; description: string }[] = [
  { type: "paragraph", label: "Texto", icon: "📝", description: "Parágrafo de texto" },
  { type: "heading1", label: "Título 1", icon: "H1", description: "Título grande" },
  { type: "heading2", label: "Título 2", icon: "H2", description: "Título médio" },
  { type: "heading3", label: "Título 3", icon: "H3", description: "Título pequeno" },
  { type: "bulletList", label: "Lista", icon: "•", description: "Lista com marcadores" },
  { type: "numberedList", label: "Lista numerada", icon: "1.", description: "Lista ordenada" },
  { type: "todoList", label: "Checklist", icon: "☑", description: "Lista de tarefas" },
  { type: "code", label: "Código", icon: "<>", description: "Bloco de código" },
  { type: "quote", label: "Citação", icon: "❝", description: "Bloco de citação" },
  { type: "callout", label: "Callout", icon: "💡", description: "Destaque com ícone" },
  { type: "divider", label: "Divisor", icon: "—", description: "Linha horizontal" },
  { type: "toggle", label: "Toggle", icon: "▶", description: "Conteúdo expansível" },
  { type: "image", label: "Imagem", icon: "🖼", description: "Upload de imagem" },
];

export default function SlashCommandMenu({ position, onSelect, onClose, filter }: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(filter.toLowerCase()) ||
    c.type.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        onSelect(filtered[selectedIndex].type);
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [filtered, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-popover border border-border rounded-lg shadow-xl py-1 w-64 max-h-72 overflow-y-auto"
      style={{ top: position.top, left: position.left }}
    >
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-1.5">Blocos</p>
      {filtered.map((cmd, i) => (
        <button
          key={cmd.type}
          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
            i === selectedIndex ? "bg-accent/20" : "hover:bg-surface-hover"
          }`}
          onMouseEnter={() => setSelectedIndex(i)}
          onClick={() => onSelect(cmd.type)}
        >
          <span className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs shrink-0">{cmd.icon}</span>
          <div>
            <p className="text-sm text-foreground">{cmd.label}</p>
            <p className="text-[10px] text-muted-foreground">{cmd.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
