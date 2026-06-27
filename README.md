ShopEasy MVP

This repository contains a minimal MVP for the ShopEasy AI Customer Support Agent.

Folders:
- backend: Node.js + TypeScript mock orchestration service
- frontend: React + Vite chat widget

Quick start (requires Node.js >= 18):

Backend

```powershell
cd backend
npm install
cp .env.example .env
# optionally set OPENAI_API_KEY in .env
npm run dev
```

Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` and try messages like:
- "Has my order ORD-1002 shipped yet?"
- "Is there a cheaper alternative to the shoes I ordered (ORD-1002)?"

Notes:
- The backend uses mocked tool implementations (`get_order`, `search_products`, `get_product`).
- If you provide an OpenAI API key we can extend the agent to use an LLM planner.
