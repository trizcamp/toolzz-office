import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface GithubRepo {
  full_name: string;
  name: string;
  private: boolean;
  owner: string;
}

// No client-side env vars needed — OAuth URL is fetched from edge function

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
      const { data: intData } = await supabase
        .from("github_integrations")
        .select("github_username")
        .eq("user_id", user.id)
        .maybeSingle();
      if (intData) {
        setConnected(true);
        setUsername(intData.github_username || null);
      } else {
        setConnected(false);
        setUsername(null);
      }
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { checkConnection(); }, [checkConnection]);

  // Check URL params for OAuth callback result
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("github") === "connected") {
      const ghUsername = params.get("username");
      setConnected(true);
      setUsername(ghUsername);
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const startOAuth = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke("github-api", {
        body: { action: "get-oauth-url" },
      });
      if (error || data?.error) throw new Error(data?.error || "Erro ao gerar URL");
      window.location.href = data.authUrl;
    } catch (e) {
      console.error("Failed to start GitHub OAuth:", e);
    }
  };

  const disconnect = async () => {
    if (!user) return;
    await supabase.from("github_integrations").delete().eq("user_id", user.id);
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
    startOAuth,
    disconnect,
    fetchRepos,
    createIssue,
    checkConnection,
  };
}
