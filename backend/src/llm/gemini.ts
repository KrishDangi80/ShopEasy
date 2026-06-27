const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

function normalizeModel(model: string) {
  const trimmed = model.trim();
  if (trimmed === 'gemini-1.5') return 'gemini-1.5-flash';
  return trimmed;
}

function extractText(json: any) {
  const candidate = json?.candidates?.[0];
  const contentText = candidate?.content?.parts
    ?.map((part: any) => part?.text || '')
    .join('')
    .trim();
  return (
    contentText ||
    candidate?.output_text ||
    candidate?.text ||
    json?.text ||
    json?.output_text ||
    ''
  );
}

export async function generateWithGemini(prompt: string, model?: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('NoGeminiKey');

  const targetModel = normalizeModel(model || DEFAULT_MODEL);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(targetModel)}:generateContent?key=${encodeURIComponent(key)}`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 800
    }
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`GeminiError:${resp.status}:${txt}`);
  }

  const json = await resp.json();
  const text = extractText(json);
  if (!text) {
    throw new Error('GeminiError:empty_response');
  }
  return text;
}

export async function answerWithGemini(userMessage: string, context: string) {
  const prompt = `You are the ShopEasy customer support agent.

Write a warm, concise, natural response in first person.
Do not use canned or repetitive phrases.
Do not mention internal tool names or JSON.
If order info is present, explain it clearly.
If product options are present, compare them naturally.
If the issue cannot be resolved from the provided context, ask one brief follow-up question.
Always end with: "Is there anything else I can help with?"

User message:
"""
${userMessage}
"""

Context from tools / system:
"""
${context || 'No additional tool context.'}
"""`;

  return generateWithGemini(prompt);
}