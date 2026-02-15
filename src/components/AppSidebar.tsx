import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  MessageSquare,
  Kanban,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Plus,
  Users,
  BarChart3,
  Calendar,
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: MessageSquare, label: "Escritório", path: "/chat" },
  { icon: Kanban, label: "Esteira", path: "/board" },
  { icon: FileText, label: "Documentos", path: "/docs" },
  { icon: Calendar, label: "Reuniões", path: "/meetings" },
  { icon: BarChart3, label: "Relatórios", path: "/reports" },
  { icon: Users, label: "Equipe", path: "/team" },
];

const workspaces = [
  { name: "Produto", color: "hsl(220 70% 55%)" },
  { name: "Marketing", color: "hsl(142 71% 45%)" },
  { name: "Vendas", color: "hsl(38 92% 50%)" },
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
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-sm">T</span>
        </div>
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

      {/* Workspaces */}
      <div className="px-3 py-3 border-b border-border shrink-0">
        <AnimatePresence>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 px-1"
            >
              Workspaces
            </motion.p>
          )}
        </AnimatePresence>
        <div className="flex flex-col gap-1">
          {workspaces.map((ws) => (
            <button
              key={ws.name}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-surface-hover transition-colors"
            >
              <div
                className="w-5 h-5 rounded-md shrink-0"
                style={{ backgroundColor: ws.color }}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-secondary-foreground whitespace-nowrap"
                  >
                    {ws.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
          <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-surface-hover transition-colors text-muted-foreground">
            <Plus className="w-5 h-5 shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs whitespace-nowrap"
                >
                  Novo workspace
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
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
