import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { action, ...params } = await req.json();

    // Get user's GitHub token
    const { data: integration, error: intError } = await supabase
      .from("github_integrations")
      .select("access_token, github_username")
      .eq("user_id", user.id)
      .maybeSingle();

    if (action === "check-connection") {
      return new Response(JSON.stringify({ connected: !!integration }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "connect") {
      const { token } = params;
      if (!token) throw new Error("Token is required");

      // Validate token with GitHub
      const ghRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${token}`, "User-Agent": "Toolzz-Office" },
      });
      if (!ghRes.ok) throw new Error("Token GitHub inválido");
      const ghUser = await ghRes.json();

      // Upsert integration
      const { error: upsertErr } = await supabase
        .from("github_integrations")
        .upsert({
          user_id: user.id,
          access_token: token,
          github_username: ghUser.login,
        }, { onConflict: "user_id" });

      if (upsertErr) throw upsertErr;

      return new Response(JSON.stringify({ connected: true, username: ghUser.login }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disconnect") {
      await supabase.from("github_integrations").delete().eq("user_id", user.id);
      return new Response(JSON.stringify({ connected: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!integration) throw new Error("GitHub não conectado");

    const ghHeaders = {
      Authorization: `Bearer ${integration.access_token}`,
      "User-Agent": "Toolzz-Office",
      Accept: "application/vnd.github.v3+json",
    };

    if (action === "list-repos") {
      const repos: any[] = [];
      let page = 1;
      while (true) {
        const res = await fetch(`https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated`, {
          headers: ghHeaders,
        });
        if (!res.ok) throw new Error("Erro ao buscar repositórios");
        const data = await res.json();
        if (data.length === 0) break;
        repos.push(...data.map((r: any) => ({ full_name: r.full_name, name: r.name, private: r.private, owner: r.owner?.login })));
        if (data.length < 100) break;
        page++;
      }
      return new Response(JSON.stringify({ repos }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create-issue") {
      const { repo, title, body, labels } = params;
      if (!repo || !title) throw new Error("repo and title required");

      const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
        method: "POST",
        headers: { ...ghHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body: body || "",
          labels: labels || [],
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(`GitHub API error: ${JSON.stringify(errData)}`);
      }
      const issue = await res.json();

      return new Response(JSON.stringify({
        issue_number: issue.number,
        issue_url: issue.html_url,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (e) {
    console.error("github-api error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
