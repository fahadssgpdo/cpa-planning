import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { GetDashboardAnalyticsResponse, GetDashboardAiInsightsBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/analytics", async (_req, res): Promise<void> => {
  const sugByStatus = await db.execute(sql`
    SELECT status AS key, count(*)::int AS count FROM suggestions GROUP BY status
  `);
  const sugByCategory = await db.execute(sql`
    SELECT category AS key, count(*)::int AS count FROM suggestions GROUP BY category
  `);
  const inqByStatus = await db.execute(sql`
    SELECT status AS key, count(*)::int AS count FROM inquiries GROUP BY status
  `);
  const inqByCategory = await db.execute(sql`
    SELECT category AS key, count(*)::int AS count FROM inquiries GROUP BY category
  `);
  const weeklyRaw = await db.execute(sql`
    WITH weeks AS (
      SELECT generate_series(
        date_trunc('week', now()) - interval '7 weeks',
        date_trunc('week', now()),
        interval '1 week'
      ) AS week_start
    )
    SELECT
      to_char(w.week_start, 'YYYY-MM-DD') AS week,
      COALESCE(s.cnt, 0)::int AS suggestions,
      COALESCE(i.cnt, 0)::int AS inquiries,
      COALESCE(d.cnt, 0)::int AS discussions
    FROM weeks w
    LEFT JOIN (
      SELECT date_trunc('week', created_at) AS wk, count(*)::int AS cnt
      FROM suggestions GROUP BY wk
    ) s ON s.wk = w.week_start
    LEFT JOIN (
      SELECT date_trunc('week', created_at) AS wk, count(*)::int AS cnt
      FROM inquiries GROUP BY wk
    ) i ON i.wk = w.week_start
    LEFT JOIN (
      SELECT date_trunc('week', created_at) AS wk, count(*)::int AS cnt
      FROM discussions GROUP BY wk
    ) d ON d.wk = w.week_start
    ORDER BY w.week_start
  `);
  const topRaw = await db.execute(sql`
    SELECT u.id AS "userId", u.name_ar AS name, COUNT(*)::int AS count
    FROM (
      SELECT user_id FROM suggestions
      UNION ALL
      SELECT user_id FROM inquiries
      UNION ALL
      SELECT user_id FROM comments
    ) submissions
    JOIN users u ON u.id = submissions.user_id
    GROUP BY u.id, u.name_ar
    ORDER BY COUNT(*) DESC
    LIMIT 7
  `);
  const rateRaw = await db.execute(sql`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE status IN ('answered', 'resolved'))::int AS resolved
    FROM inquiries
  `);

  const toRows = (r: unknown) => Array.from(r as Iterable<Record<string, unknown>>);

  const rateRows = toRows(rateRaw);
  const rateRow = rateRows[0] ?? {};
  const total = Number(rateRow["total"] ?? 0);
  const resolved = Number(rateRow["resolved"] ?? 0);
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  res.json(
    GetDashboardAnalyticsResponse.parse({
      suggestionsByStatus: toRows(sugByStatus).map((r) => ({ key: String(r["key"] ?? ""), count: Number(r["count"] ?? 0) })),
      suggestionsByCategory: toRows(sugByCategory).map((r) => ({ key: String(r["key"] ?? ""), count: Number(r["count"] ?? 0) })),
      inquiriesByStatus: toRows(inqByStatus).map((r) => ({ key: String(r["key"] ?? ""), count: Number(r["count"] ?? 0) })),
      inquiriesByCategory: toRows(inqByCategory).map((r) => ({ key: String(r["key"] ?? ""), count: Number(r["count"] ?? 0) })),
      weeklyActivity: toRows(weeklyRaw).map((r) => ({
        week: String(r["week"] ?? ""),
        suggestions: Number(r["suggestions"] ?? 0),
        inquiries: Number(r["inquiries"] ?? 0),
        discussions: Number(r["discussions"] ?? 0),
      })),
      topContributors: toRows(topRaw).map((r) => ({
        userId: Number(r["userId"] ?? 0),
        name: String(r["name"] ?? ""),
        count: Number(r["count"] ?? 0),
      })),
      resolutionRate,
    })
  );
});

router.post("/dashboard/ai-insights", async (req, res): Promise<void> => {
  const data = GetDashboardAiInsightsBody.safeParse(req.body);
  if (!data.success) {
    res.status(400).json({ error: "Invalid analytics data" });
    return;
  }

  const d = data.data;
  const prompt = `You are an AI analytics copilot for HEMA (هيئة حماية المستهلك) — the Consumer Protection Authority's Planning Department internal platform. Analyze the following real-time data and generate 5 concise, bilingual insights (Arabic + English) for the planning team leadership.

Platform Data:
- Suggestions by Status: ${JSON.stringify(d.suggestionsByStatus)}
- Suggestions by Category: ${JSON.stringify(d.suggestionsByCategory)}
- Inquiries by Status: ${JSON.stringify(d.inquiriesByStatus)}
- Inquiries by Category: ${JSON.stringify(d.inquiriesByCategory)}
- Weekly Activity (last 8 weeks): ${JSON.stringify(d.weeklyActivity)}
- Top Contributors (by total submissions): ${JSON.stringify(d.topContributors)}
- Inquiry Resolution Rate: ${d.resolutionRate}%

Generate exactly 5 insights. Each must have:
- titleAr: short Arabic title (max 6 words)
- titleEn: short English title (max 6 words)
- descAr: 1-2 sentence Arabic description with a specific observation and recommendation
- descEn: 1-2 sentence English description with a specific observation and recommendation
- type: exactly one of "positive" | "warning" | "neutral" | "action"

Rules: "positive" = strengths & good metrics, "warning" = concerns or gaps needing attention, "action" = concrete recommended next step, "neutral" = informational trend.

Respond ONLY with a valid JSON array of exactly 5 objects. No markdown fences, no explanation text, nothing else — just the JSON array starting with [ and ending with ].`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const block = message.content[0];
    const text = block.type === "text" ? block.text : "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const insights = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    res.json({ insights });
  } catch {
    res.status(500).json({ error: "AI service unavailable" });
  }
});

export default router;
