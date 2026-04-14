// Cloudflare Pages Function - thin proxy to Anthropic API
// This function forwards your request to Anthropic using YOUR API key.
// It does not log, store, or inspect your key or document content.
// Source: https://github.com/Get-Ai-Tools/getaitools-website

export async function onRequestPost(context) {
  try {
    const { apiKey, text, outputType, model, customInstructions } = await context.request.json();

    if (!apiKey || !text) {
      return json({ error: 'Missing apiKey or text' }, 400);
    }

    const prompts = {
      summary:    'Write a clear, comprehensive summary of this document in 3-5 paragraphs. Cover the main points, arguments, and conclusions.',
      bullets:    'Extract the key points from this document as a concise bullet-point list. Focus on the most important facts, findings, and conclusions.',
      takeaways:  'What are the most important takeaways from this document? List the top 5-8 actionable insights or conclusions a reader should remember.'
    };

    const basePrompt = prompts[outputType] || prompts.summary;
    const prompt = customInstructions
      ? `${basePrompt}\n\nAdditional instructions: ${customInstructions}`
      : basePrompt;
    const truncated = text.slice(0, 80000); // stay within context limits

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `${prompt}\n\n---\n\n${truncated}`
        }]
      })
    });

    const data = await anthropicRes.json();

    return json(data, anthropicRes.status);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
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
