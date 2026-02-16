import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Volume2, Hash, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Room, RoomType } from "@/contexts/VoiceConnectionContext";

interface RoomFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: Room | null;
  onSubmit: (data: { name: string; category: string; type: RoomType }) => void;
  categories: string[];
}

const roomTypes: { value: RoomType; label: string; icon: typeof Volume2 }[] = [
  { value: "text", label: "Texto", icon: Hash },
  { value: "voice", label: "Voz", icon: Volume2 },
  { value: "hybrid", label: "Híbrido", icon: Headphones },
];

export default function RoomFormDialog({ open, onOpenChange, room, onSubmit, categories }: RoomFormDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<RoomType>("text");

  useEffect(() => {
    if (room) {
      setName(room.name);
      setCategory(room.category);
      setType(room.type);
    } else {
      setName("");
      setCategory(categories[0] || "");
      setType("text");
    }
  }, [room, open, categories]);

  const handleSubmit = () => {
    if (!name.trim() || !category) return;
    onSubmit({ name: name.trim(), category, type });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{room ? "Editar Canal" : "Novo Canal"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do canal" />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <div className="flex gap-2">
              {roomTypes.map((rt) => (
                <button
                  key={rt.value}
                  onClick={() => setType(rt.value)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors",
                    type === rt.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-muted-foreground"
                  )}
                >
                  <rt.icon className="w-4 h-4" />
                  <span className="text-xs">{rt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !category}>
            {room ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
