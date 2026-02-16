import { useState } from "react";
import { Search, Bell, Settings } from "lucide-react";
import SettingsDialog from "@/components/settings/SettingsDialog";

export default function TopBar() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        {/* Search */}
        <div className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2 w-80">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
          <kbd className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border">
            ⌘K
          </kbd>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-muted-foreground hover:text-foreground">
            <Bell className="w-[18px] h-[18px]" />
          </button>
          <button
            className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-muted-foreground hover:text-foreground"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="w-[18px] h-[18px]" />
          </button>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center ml-2">
            <span className="text-xs font-medium text-primary">BF</span>
          </div>
        </div>
      </header>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
