// Cloudflare Pages Function
// Lives at /api/generate-quiz once deployed, and is called by index.html.
// Keeps the Anthropic API key on the server, never in the browser.
//
// Setup (one-time, in the Cloudflare dashboard):
//   Pages project -> Settings -> Environment variables -> add
//   ANTHROPIC_API_KEY = sk-ant-...   (get one at https://console.anthropic.com/settings/keys)
// Redeploy after adding it.

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Server is missing ANTHROPIC_API_KEY. Add it in Cloudflare Pages > Settings > Environment variables." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { system, userMessage } = body;
  if (!system || !userMessage) {
    return new Response(JSON.stringify({ error: "Missing system or userMessage" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Basic guardrails so this endpoint can only be used for what it's meant for,
  // and can't be abused to run arbitrary/expensive prompts.
  if (userMessage.length > 4000 || system.length > 4000) {
    return new Response(JSON.stringify({ error: "Request too large" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: system,
        messages: [{ role: "user", content: userMessage }]
      })
    });

    const data = await anthropicResponse.json();

    if (!anthropicResponse.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || "Anthropic API error" }), {
        status: anthropicResponse.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to reach Anthropic API" }), {
      status: 502,
      headers: { "Content-Type": "application/json" }
    });
  }
}
