import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface ComingSoonPageProps {
  title: string;
  description: string;
  variant?: "office" | "meetings" | "automations";
}

function OfficeSkeleton() {
  return (
    <div className="w-[300px] rounded-xl border border-border bg-card p-5 shadow-lg space-y-4">
      {/* Sidebar + chat layout */}
      <div className="flex gap-3 h-[140px]">
        {/* Sidebar with channels */}
        <div className="w-[70px] space-y-2 shrink-0">
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-6 w-full rounded-md" />
          <Skeleton className="h-6 w-full rounded-md" />
          <Skeleton className="h-6 w-full rounded-md" />
          <Skeleton className="h-3 w-3/4 rounded-full mt-2" />
          <Skeleton className="h-6 w-full rounded-md" />
        </div>
        {/* Chat area */}
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-3 w-1/2 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex gap-1.5 items-start">
              <Skeleton className="w-5 h-5 rounded-full shrink-0" />
              <Skeleton className="h-8 flex-1 rounded-lg" />
            </div>
            <div className="flex gap-1.5 items-start">
              <Skeleton className="w-5 h-5 rounded-full shrink-0" />
              <Skeleton className="h-5 w-3/4 rounded-lg" />
            </div>
            <div className="flex gap-1.5 items-start">
              <Skeleton className="w-5 h-5 rounded-full shrink-0" />
              <Skeleton className="h-10 flex-1 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-7 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

function MeetingsSkeleton() {
  return (
    <div className="w-[300px] rounded-xl border border-border bg-card p-5 shadow-lg space-y-4">
      {/* Meeting cards */}
      <div className="flex items-center gap-2 mb-1">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-border rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-2/3 rounded-full" />
            <Skeleton className="h-4 w-12 rounded-md" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex gap-1.5">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="w-4 h-4 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function AutomationsSkeleton() {
  return (
    <div className="w-[300px] rounded-xl border border-border bg-card p-5 shadow-lg space-y-4">
      {/* Workflow nodes */}
      <div className="flex items-center justify-center gap-2 mb-1">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-1 w-6 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-1 w-6 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-md shrink-0" />
          <Skeleton className="h-3 flex-1 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-md shrink-0" />
          <Skeleton className="h-3 flex-1 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-md shrink-0" />
          <Skeleton className="h-3 flex-1 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

const skeletonMap = {
  office: OfficeSkeleton,
  meetings: MeetingsSkeleton,
  automations: AutomationsSkeleton,
};

export default function ComingSoonPage({ title, description, variant = "office" }: ComingSoonPageProps) {
  const SkeletonComponent = skeletonMap[variant];

  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6 max-w-md text-center"
      >
        <SkeletonComponent />

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
