import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ToolzzChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ToolzzChatDialog({ open, onOpenChange }: ToolzzChatDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!open || initialized.current) return;

    const script = document.createElement("script");
    script.type = "module";
    script.textContent = `
      import Chatbot from "https://chat-embed.toolzz.ai/dist/web.js";
      Chatbot.initTzzaiWeb({ id: "92658cc0-7927-46f9-bce9-9972b6aae3d7" });
    `;
    document.body.appendChild(script);
    initialized.current = true;

    return () => {
      // script stays loaded once initialized
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogTitle className="sr-only">Chat com IA Toolzz</DialogTitle>
        <div ref={containerRef} className="flex-1 w-full h-full" id="toolzz-chat-container" />
      </DialogContent>
    </Dialog>
  );
}
