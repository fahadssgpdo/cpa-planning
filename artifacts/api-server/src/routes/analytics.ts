import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { GetDashboardAnalyticsResponse } from "@workspace/api-zod";
import { requireSession } from "../middlewares/announcement-auth";

const router: IRouter = Router();

router.get("/dashboard/analytics", requireSession, async (_req, res): Promise<void> => {
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

export default router;
