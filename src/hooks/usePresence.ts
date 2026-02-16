import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PresenceUser {
  user_id: string;
  name: string;
  online_at: string;
}

export function usePresence(roomId: string | null) {
  const { user } = useAuth();
  const [presenceState, setPresenceState] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!roomId || !user) return;

    const channel = supabase.channel(`presence-${roomId}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = [];
        for (const key in state) {
          const presences = state[key] as any[];
          if (presences.length > 0) {
            users.push({
              user_id: key,
              name: presences[0].name || "Anônimo",
              online_at: presences[0].online_at,
            });
          }
        }
        setPresenceState(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            name: user.user_metadata?.name || user.email?.split("@")[0] || "Anônimo",
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user]);

  return { onlineUsers: presenceState };
}
