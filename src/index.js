// Cloudflare Worker entry point.
// Handles POST /api/generate-quiz (keeps the Anthropic API key server-side),
// and serves everything else as a static asset from /public.
//
// Setup (one-time, in the Cloudflare dashboard):
//   Your Worker's project page -> Settings -> Variables and Secrets -> Add
//   Name: ANTHROPIC_API_KEY   Type: Secret   Value: sk-ant-...
//   (get a key at https://console.anthropic.com/settings/keys)
// Redeploy after adding it.

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/generate-quiz" && request.method === "POST") {
      return handleGenerateQuiz(request, env);
    }

    // Everything else: serve the static site from /public.
    return env.ASSETS.fetch(request);
  }
};

async function handleGenerateQuiz(request, env) {
  if (!env.ANTHROPIC_API_KEY) {
    return jsonResponse(
      { error: "Server is missing ANTHROPIC_API_KEY. Add it in your Worker's Settings > Variables and Secrets." },
      500
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const { system, userMessage } = body;
  if (!system || !userMessage) {
    return jsonResponse({ error: "Missing system or userMessage" }, 400);
  }

  // Basic guardrails so this endpoint can only be used for what it's meant for,
  // and can't be abused to run arbitrary/expensive prompts.
  if (userMessage.length > 4000 || system.length > 4000) {
    return jsonResponse({ error: "Request too large" }, 400);
  }

  try {
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    };
    if (env.ANTHROPIC_WORKSPACE_ID) {
      headers["anthropic-workspace-id"] = env.ANTHROPIC_WORKSPACE_ID;
    }

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1000,
        system: system,
        messages: [{ role: "user", content: userMessage }]
      })
    });

    const data = await anthropicResponse.json();

    if (!anthropicResponse.ok) {
      return jsonResponse({ error: data.error?.message || "Anthropic API error" }, anthropicResponse.status);
    }

    return jsonResponse(data, 200);
  } catch (err) {
    return jsonResponse({ error: "Failed to reach Anthropic API" }, 502);
  }
}

function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
