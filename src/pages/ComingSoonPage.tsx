import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface ComingSoonPageProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export default function ComingSoonPage({ title, description, icon }: ComingSoonPageProps) {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6 max-w-md text-center"
      >
        {/* Skeleton mockup card */}
        <div className="w-[280px] rounded-xl border border-border bg-card p-5 shadow-lg space-y-4">
          {/* Fake window dots + bar */}
          <div className="flex items-center gap-1.5 mb-3">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/20" />
            <span className="w-2 h-2 rounded-full bg-muted-foreground/20" />
            <span className="w-2 h-2 rounded-full bg-muted-foreground/20" />
            <Skeleton className="h-2.5 flex-1 ml-2 rounded-full" />
          </div>
          {/* Skeleton rows */}
          <div className="flex gap-3">
            <Skeleton className="h-16 flex-1 rounded-lg" />
            <Skeleton className="h-16 flex-1 rounded-lg" />
            <Skeleton className="h-16 flex-1 rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-full rounded-full" />
            <Skeleton className="h-2.5 w-3/4 rounded-full" />
            <Skeleton className="h-2.5 w-1/2 rounded-full" />
          </div>
        </div>

        {/* Title + badge */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">Em breve</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </motion.div>
    </div>
  );
}
