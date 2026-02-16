import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // contains user_id

  if (!code || !state) {
    return new Response("Missing code or state", { status: 400 });
  }

  const clientId = Deno.env.get("GITHUB_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GITHUB_CLIENT_SECRET")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error || !tokenData.access_token) {
      console.error("GitHub token exchange error:", tokenData);
      return new Response(`GitHub OAuth error: ${tokenData.error_description || tokenData.error}`, { status: 400 });
    }

    const accessToken = tokenData.access_token;

    // Get GitHub username
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": "Toolzz-Office" },
    });
    const ghUser = await userRes.json();

    // Store in database using service role key (no RLS)
    const supabase = createClient(supabaseUrl, serviceKey);

    const { error: upsertErr } = await supabase
      .from("github_integrations")
      .upsert({
        user_id: state,
        access_token: accessToken,
        github_username: ghUser.login,
      }, { onConflict: "user_id" });

    if (upsertErr) {
      console.error("Upsert error:", upsertErr);
      return new Response("Failed to save integration", { status: 500 });
    }

    // Redirect back to the app integrations page with success
    const appUrl = Deno.env.get("SITE_URL") || "https://id-preview--d125e482-0768-4a41-ab02-6fff17e68029.lovable.app";

    return new Response(null, {
      status: 302,
      headers: {
        Location: `${appUrl}/integrations?github=connected&username=${ghUser.login}`,
      },
    });
  } catch (e) {
    console.error("GitHub callback error:", e);
    return new Response("Internal error", { status: 500 });
  }
});
