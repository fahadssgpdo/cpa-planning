import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import announcementsRouter from "./announcements";
import discussionsRouter from "./discussions";
import inquiriesRouter from "./inquiries";
import documentsRouter from "./documents";
import faqsRouter from "./faqs";
import suggestionsRouter from "./suggestions";
import dashboardRouter from "./dashboard";
import auditLogsRouter from "./audit-logs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(announcementsRouter);
router.use(discussionsRouter);
router.use(inquiriesRouter);
router.use(documentsRouter);
router.use(faqsRouter);
router.use(suggestionsRouter);
router.use(dashboardRouter);
router.use(auditLogsRouter);

export default router;
