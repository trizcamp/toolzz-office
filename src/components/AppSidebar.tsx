import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Building2,
  Kanban,
  FileText,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Puzzle,
} from "lucide-react";
import VoiceConnectionBar from "./VoiceConnectionBar";
import toolzzLogo from "@/assets/toolzz-logo.png";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Building2, label: "Escritório", path: "/chat" },
  { icon: Kanban, label: "Esteira", path: "/board" },
  { icon: FileText, label: "Documentos", path: "/docs" },
  { icon: Calendar, label: "Reuniões", path: "/meetings" },
  { icon: Calendar, label: "Calendário", path: "/calendar" },
  { icon: Puzzle, label: "Integrações", path: "/integrations" },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-screen flex flex-col border-r border-border bg-sidebar sticky top-0 z-30 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
        <img src={toolzzLogo} alt="Toolzz" className="w-8 h-8 rounded-lg shrink-0 object-contain" />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-semibold text-foreground text-sm whitespace-nowrap"
            >
              Toolzz Office
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        <div className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? "bg-surface-hover text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Voice Connection Bar */}
      <VoiceConnectionBar collapsed={collapsed} />

      {/* Collapse toggle */}
      <div className="px-3 py-3 border-t border-border shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors w-full"
        >
          {collapsed ? (
            <ChevronRight className="w-[18px] h-[18px] shrink-0" />
          ) : (
            <ChevronLeft className="w-[18px] h-[18px] shrink-0" />
          )}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                Recolher
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
