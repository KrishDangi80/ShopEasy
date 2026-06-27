import { generateWithGemini } from './gemini';

export type PlanStep = { tool: string; args: Record<string, any> };

export async function planFromLLM(message: string): Promise<PlanStep[] | null> {
  try {
    const prompt = `You are an assistant that outputs a JSON plan for tool execution. Available tools: get_order(order_id), search_products(query), get_product(product_id).
Given the user message, produce a JSON object with a top-level key "plan" which is an array of steps. Each step is an object with keys: "tool" and "args". Example: {"plan":[{"tool":"get_order","args":{"order_id":"ORD-1002"}},{"tool":"search_products","args":{"query":"running shoes under $89"}}]}

User message: """
${message}
"""

Only output valid JSON and nothing else.
`;

    const completion = await generateWithGemini(prompt);
    // Try parse JSON from completion
    const jsonStart = completion.indexOf('{');
    const jsonText = jsonStart >= 0 ? completion.slice(jsonStart) : completion;
    const parsed = JSON.parse(jsonText);
    if (parsed && Array.isArray(parsed.plan)) return parsed.plan as PlanStep[];
    return null;
  } catch (err) {
    console.error('Planner error', err);
    return null;
  }
}
