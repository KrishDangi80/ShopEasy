const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5'

export async function generateWithGemini(prompt: string, model?: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('NoGeminiKey');
  const targetModel = model || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1/models/${targetModel}:generateText`;

  const body = {
    prompt: { text: prompt },
    temperature: 0.0,
    maxOutputTokens: 800
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`GeminiError:${resp.status}:${txt}`);
  }

  const json = await resp.json();
  // Expecting response.candidates[0].content or output[0].content
  const candidate = json.candidates?.[0]?.content || json.outputs?.[0]?.content || json.candidates?.[0]?.text;
  if (!candidate) {
    return JSON.stringify(json);
  }
  return candidate;
}
