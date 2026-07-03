import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, announcementsTable, discussionsTable, inquiriesTable, documentsTable, suggestionsTable, usersTable } from "@workspace/db";
import { GetDashboardStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const [{ openInquiries }] = await db
    .select({ openInquiries: sql<number>`cast(count(*) as int)` })
    .from(inquiriesTable)
    .where(eq(inquiriesTable.status, "open"));

  const [{ newSuggestions }] = await db
    .select({ newSuggestions: sql<number>`cast(count(*) as int)` })
    .from(suggestionsTable)
    .where(eq(suggestionsTable.status, "new"));

  const [{ activeDiscussions }] = await db
    .select({ activeDiscussions: sql<number>`cast(count(*) as int)` })
    .from(discussionsTable)
    .where(eq(discussionsTable.status, "open"));

  const [{ totalDocuments }] = await db
    .select({ totalDocuments: sql<number>`cast(count(*) as int)` })
    .from(documentsTable);

  const [{ recentAnnouncements }] = await db
    .select({ recentAnnouncements: sql<number>`cast(count(*) as int)` })
    .from(announcementsTable)
    .where(eq(announcementsTable.archived, false));

  const [{ totalUsers }] = await db
    .select({ totalUsers: sql<number>`cast(count(*) as int)` })
    .from(usersTable)
    .where(eq(usersTable.active, true));

  res.json(
    GetDashboardStatsResponse.parse({
      openInquiries: openInquiries ?? 0,
      newSuggestions: newSuggestions ?? 0,
      activeDiscussions: activeDiscussions ?? 0,
      totalDocuments: totalDocuments ?? 0,
      recentAnnouncements: recentAnnouncements ?? 0,
      totalUsers: totalUsers ?? 0,
    })
  );
});

export default router;
