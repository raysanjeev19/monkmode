import type { VercelRequest, VercelResponse } from "@vercel/node";

// GET /api/health — liveness probe (no DB needed)
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ ok: true, service: "monkmode-api", time: new Date().toISOString() });
}
