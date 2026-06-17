import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "./_prisma";

/**
 * Cloud sync for the local-first app — one JSON snapshot per user.
 *   GET  /api/state?userId=abc        → { data, updatedAt }
 *   POST /api/state  { userId, data } → { ok, updatedAt }   (upsert)
 *
 * `data` is exactly the JSON the app already produces in Profile → Export,
 * so enabling sync is a drop-in: push on change, pull on launch.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS (same-origin in prod; permissive helps local testing)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const userId =
    (typeof req.query.userId === "string" && req.query.userId) ||
    (req.body && (req.body as Record<string, unknown>).userId);

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    if (req.method === "GET") {
      const snap = await prisma.snapshot.findUnique({ where: { userId } });
      return res.status(200).json({ data: snap?.data ?? null, updatedAt: snap?.updatedAt ?? null });
    }

    if (req.method === "POST" || req.method === "PUT") {
      const data = (req.body as Record<string, unknown>)?.data;
      if (data === undefined) return res.status(400).json({ error: "data is required" });
      const snap = await prisma.snapshot.upsert({
        where: { userId },
        create: { userId, data: data as object },
        update: { data: data as object },
      });
      return res.status(200).json({ ok: true, updatedAt: snap.updatedAt });
    }

    res.setHeader("Allow", "GET, POST, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: "Server error", detail: String(err) });
  }
}
