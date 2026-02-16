import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface GithubRepo {
  full_name: string;
  name: string;
  private: boolean;
  owner: string;
}

export function useGithubIntegration() {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);

  const checkConnection = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data } = await supabase.functions.invoke("github-api", {
        body: { action: "check-connection" },
      });
      setConnected(!!data?.connected);
      // Also check username from DB
      const { data: intData } = await supabase
        .from("github_integrations")
        .select("github_username")
        .eq("user_id", user.id)
        .maybeSingle();
      setUsername(intData?.github_username || null);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { checkConnection(); }, [checkConnection]);

  const connect = async (token: string) => {
    const { data, error } = await supabase.functions.invoke("github-api", {
      body: { action: "connect", token },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    setConnected(true);
    setUsername(data?.username || null);
    return data;
  };

  const disconnect = async () => {
    await supabase.functions.invoke("github-api", {
      body: { action: "disconnect" },
    });
    setConnected(false);
    setUsername(null);
    setRepos([]);
  };

  const fetchRepos = async () => {
    setLoadingRepos(true);
    try {
      const { data, error } = await supabase.functions.invoke("github-api", {
        body: { action: "list-repos" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setRepos(data?.repos || []);
      return data?.repos || [];
    } finally {
      setLoadingRepos(false);
    }
  };

  const createIssue = async (repo: string, title: string, body: string, labels: string[]) => {
    const { data, error } = await supabase.functions.invoke("github-api", {
      body: { action: "create-issue", repo, title, body, labels },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  return {
    connected,
    username,
    loading,
    repos,
    loadingRepos,
    connect,
    disconnect,
    fetchRepos,
    createIssue,
    checkConnection,
  };
}
