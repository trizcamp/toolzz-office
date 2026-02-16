import { motion } from "framer-motion";
import { Mic, Phone, Users, MessageSquare } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const taskModes = [
  { id: "voice", icon: Phone, label: "Voz com IA", desc: "Descreva por voz" },
  { id: "meeting", icon: Users, label: "Reunião", desc: "Com a equipe" },
  { id: "chat", icon: MessageSquare, label: "Via chat", desc: "Escreva para IA" },
];

export default function HomePage() {
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  return (
    <div className="h-full flex flex-col items-center justify-center relative">
      {/* Central content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-8"
      >
        {/* Pulsing circle */}
        <div className="relative">
          <motion.div
            className={cn(
              "w-48 h-48 rounded-full border-2 border-muted-foreground/20 flex items-center justify-center cursor-pointer transition-colors",
              isListening && "border-primary"
            )}
            animate={isListening ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            onClick={() => setIsListening(!isListening)}
          >
            {isListening && (
              <motion.div
                className="absolute inset-0 rounded-full border border-primary/30"
                animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </motion.div>
        </div>

        {/* Greeting */}
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">
            {getGreeting()} Boss..
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Como posso te ajudar hoje?
          </p>
        </div>

        {/* Mic button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsListening(!isListening)}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
            isListening
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Mic className="w-6 h-6" />
        </motion.button>
      </motion.div>

      {/* Task creation modes - right side */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2"
      >
        {taskModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setActiveMode(activeMode === mode.id ? null : mode.id)}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all group relative",
              activeMode === mode.id
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            )}
          >
            <mode.icon className="w-4 h-4" />
            {/* Tooltip */}
            <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-popover border border-border rounded-md px-3 py-1.5 whitespace-nowrap shadow-lg">
                <p className="text-xs font-medium text-foreground">{mode.label}</p>
                <p className="text-[10px] text-muted-foreground">{mode.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </motion.div>

      {/* Branding */}
      <div className="absolute bottom-6 right-6 flex items-center gap-1.5 text-muted-foreground/30">
        <span className="text-[10px] font-medium tracking-wider">Toolzz</span>
        <span className="text-[10px]">OS</span>
      </div>
    </div>
  );
}
