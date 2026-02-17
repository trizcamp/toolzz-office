import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

interface SpreadsheetEditorProps {
  data: Record<string, string>;
  onChange: (data: Record<string, string>) => void;
}

const COLS = 26; // A-Z
const INITIAL_ROWS = 50;

const colLabel = (i: number) => String.fromCharCode(65 + i);
const cellKey = (row: number, col: number) => `${colLabel(col)}${row + 1}`;

export default function SpreadsheetEditor({ data, onChange }: SpreadsheetEditorProps) {
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selection, setSelection] = useState<{ start: string; end: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const rowCount = useMemo(() => {
    let maxRow = INITIAL_ROWS;
    Object.keys(data).forEach((key) => {
      const match = key.match(/^[A-Z]+(\d+)$/);
      if (match) maxRow = Math.max(maxRow, parseInt(match[1]) + 5);
    });
    return maxRow;
  }, [data]);

  const handleCellClick = useCallback((key: string) => {
    setActiveCell(key);
    setSelection(null);
  }, []);

  const handleCellDoubleClick = useCallback((key: string) => {
    setEditingCell(key);
    setEditValue(data[key] || "");
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [data]);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const newData = { ...data };
    if (editValue.trim()) {
      newData[editingCell] = editValue;
    } else {
      delete newData[editingCell];
    }
    onChange(newData);
    setEditingCell(null);
    setEditValue("");
  }, [editingCell, editValue, data, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (editingCell) {
      if (e.key === "Enter") { commitEdit(); }
      if (e.key === "Escape") { setEditingCell(null); setEditValue(""); }
      if (e.key === "Tab") {
        e.preventDefault();
        commitEdit();
        // Move to next cell
        if (activeCell) {
          const col = activeCell.charCodeAt(0) - 65;
          const row = parseInt(activeCell.slice(1)) - 1;
          const nextCol = e.shiftKey ? Math.max(0, col - 1) : Math.min(COLS - 1, col + 1);
          const nextKey = cellKey(row, nextCol);
          setActiveCell(nextKey);
          setEditingCell(nextKey);
          setEditValue(data[nextKey] || "");
          setTimeout(() => inputRef.current?.focus(), 0);
        }
      }
      return;
    }

    if (!activeCell) return;
    const col = activeCell.charCodeAt(0) - 65;
    const row = parseInt(activeCell.slice(1)) - 1;

    if (e.key === "ArrowUp") { e.preventDefault(); if (row > 0) setActiveCell(cellKey(row - 1, col)); }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveCell(cellKey(row + 1, col)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); if (col > 0) setActiveCell(cellKey(row, col - 1)); }
    if (e.key === "ArrowRight") { e.preventDefault(); if (col < COLS - 1) setActiveCell(cellKey(row, col + 1)); }
    if (e.key === "Tab") {
      e.preventDefault();
      const nextCol = e.shiftKey ? Math.max(0, col - 1) : Math.min(COLS - 1, col + 1);
      setActiveCell(cellKey(row, nextCol));
    }
    if (e.key === "Enter") {
      handleCellDoubleClick(activeCell);
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      if (data[activeCell]) {
        const newData = { ...data };
        delete newData[activeCell];
        onChange(newData);
      }
    }
    // Start typing directly
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      setEditingCell(activeCell);
      setEditValue(e.key);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [activeCell, editingCell, data, onChange, commitEdit, handleCellDoubleClick]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-auto outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <table className="border-collapse min-w-max">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="w-12 min-w-[48px] h-8 bg-muted border border-border text-[10px] font-medium text-muted-foreground sticky left-0 z-20" />
            {Array.from({ length: COLS }, (_, i) => (
              <th
                key={i}
                className="min-w-[100px] h-8 bg-muted border border-border text-[10px] font-medium text-muted-foreground px-2"
              >
                {colLabel(i)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }, (_, row) => (
            <tr key={row}>
              <td className="w-12 min-w-[48px] h-7 bg-muted border border-border text-[10px] font-medium text-muted-foreground text-center sticky left-0 z-10">
                {row + 1}
              </td>
              {Array.from({ length: COLS }, (_, col) => {
                const key = cellKey(row, col);
                const isActive = activeCell === key;
                const isEditing = editingCell === key;
                return (
                  <td
                    key={col}
                    className={cn(
                      "h-7 border border-border px-1.5 text-xs cursor-cell relative",
                      isActive && !isEditing && "ring-2 ring-primary ring-inset bg-primary/5",
                      !isActive && "hover:bg-muted/30"
                    )}
                    onClick={() => handleCellClick(key)}
                    onDoubleClick={() => handleCellDoubleClick(key)}
                  >
                    {isEditing ? (
                      <input
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        className="absolute inset-0 w-full h-full bg-background border-2 border-primary px-1.5 text-xs outline-none z-10"
                      />
                    ) : (
                      <span className="truncate block">{data[key] || ""}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
