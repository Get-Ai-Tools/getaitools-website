// Cloudflare Pages Function - generic Claude API proxy
// Forwards requests to Anthropic using the user's own API key.
// Nothing is logged or stored.
// Source: https://github.com/Get-Ai-Tools/getaitools-website

export async function onRequestPost(context) {
  try {
    const { apiKey, messages, model, maxTokens, system } = await context.request.json();

    if (!apiKey || !messages) {
      return json({ error: 'Missing apiKey or messages' }, 400);
    }

    const body = {
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens || 2048,
      messages,
    };
    if (system) body.system = system;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return json(data, res.status);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
