import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { get_order, search_products, get_product } from './tools/tools';
import { planFromLLM } from './llm/planner';
import { answerWithGemini } from './llm/gemini';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get('/api/get_order/:orderId', async (req, res) => {
  try {
    const order = await get_order(req.params.orderId);
    res.json(order);
  } catch (err: any) {
    if (err.message === 'OrderNotFound') return res.status(404).json({ error: 'Order not found' });
    res.status(500).json({ error: 'internal_error' });
  }
});

app.get('/api/search_products', async (req, res) => {
  const q = (req.query.q as string) || '';
  try {
    const results = await search_products(q);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'internal_error' });
  }
});

app.get('/api/get_product/:productId', async (req, res) => {
  try {
    const p = await get_product(req.params.productId);
    res.json(p);
  } catch (err: any) {
    if (err.message === 'ProductNotFound') return res.status(404).json({ error: 'Product not found' });
    res.status(500).json({ error: 'internal_error' });
  }
});

// Simple agent endpoint that orchestrates tools based on heuristics
app.post('/api/agent', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  const steps: any[] = [];
  try {
    // If Gemini key is present, ask the LLM for a plan first
    if (process.env.GEMINI_API_KEY) {
      const plan = await planFromLLM(message);
      if (plan && plan.length) {
        for (const step of plan.slice(0, 6)) {
          try {
            if (step.tool === 'get_order') {
              const order = await get_order(step.args.order_id);
              steps.push({ action: 'get_order', order });
            } else if (step.tool === 'search_products') {
              const results = await search_products(step.args.query);
              steps.push({ action: 'search_products', query: step.args.query, results });
            } else if (step.tool === 'get_product') {
              const p = await get_product(step.args.product_id);
              steps.push({ action: 'get_product', product: p });
            }
          } catch (err: any) {
            steps.push({ action: step.tool, error: err.message || String(err) });
          }
        }
        const reply = await answerWithGemini(
          message,
          JSON.stringify(
            {
              toolResults: steps,
              guidance: 'Use only the facts in toolResults. If a tool failed, mention that briefly and offer help.'
            },
            null,
            2
          )
        );
        return res.json({ reply, steps });
      }

      const reply = await answerWithGemini(
        message,
        JSON.stringify(
          {
            toolResults: [],
            guidance: 'No tools were required. Answer the user naturally and helpfully.'
          },
          null,
          2
        )
      );
      return res.json({ reply, steps });
    }

    // Fallback heuristics (previous behavior)
    // detect order id
    const orderMatch = message.match(/(ORD-\d+)/i);
    if (orderMatch) {
      const orderId = orderMatch[1].toUpperCase();
      try {
        const order = await get_order(orderId);
        steps.push({ action: 'get_order', order });

        // if user asks for cheaper alternative
        if (/cheaper|alternative|cheapest/i.test(message)) {
          const price = order.items[0]?.price ?? 0;
          const query = `running shoes under $${price}`;
          const results = await search_products(query);
          steps.push({ action: 'search_products', query, results });
          const top = results[0];
          if (top) {
            const enriched = await get_product(top.id);
            steps.push({ action: 'get_product', product: enriched });
            const reply = `Great news — your order ${orderId} includes ${order.items[0].name} ($${order.items[0].price}). I found a cheaper alternative: ${enriched.name} for $${enriched.price}. ${enriched.stock}. Is there anything else I can help with?`;
            return res.json({ reply, steps });
          }
          const reply = `I couldn't find cheaper alternatives under $${price}. Would you like me to show popular items?`;
          return res.json({ reply, steps });
        }

        // default order status reply
        const reply = `Good news — your order ${orderId} is currently ${order.status}. Estimated delivery: ${order.eta}. Track here: ${order.tracking_url || 'N/A'}. Anything else I can help with?`;
        return res.json({ reply, steps });
      } catch (err: any) {
        if (err.message === 'OrderNotFound') {
          return res.json({ reply: "I couldn't find an order with that ID. Could you double-check the number?", steps });
        }
        throw err;
      }
    }

    // No order id — handle general product search
    if (/alternative|cheaper|under \$/i.test(message) || /show me|recommend/i.test(message)) {
      // extract price if present
      const priceMatch = message.match(/under \$(\d+)/i);
      const query = priceMatch ? `running shoes under $${priceMatch[1]}` : 'running shoes';
      const results = await search_products(query);
      steps.push({ action: 'search_products', query, results });
      const top = results.slice(0, 3);
      const reply = `Here are some options: ${top.map((t: any) => `${t.name} ($${t.price})`).join('; ')}. Want full details on any of these?`;
      return res.json({ reply, steps });
    }

    // fallback
    return res.json({ reply: "I'm not sure I understand — could you clarify?", steps });
  } catch (err) {
    res.status(500).json({ error: 'agent_error' });
  }
});

app.listen(PORT, () => console.log(`ShopEasy mock backend running on ${PORT}`));
