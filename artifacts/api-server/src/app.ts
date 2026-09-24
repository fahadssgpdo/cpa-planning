import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { requireSession } from "./middlewares/announcement-auth";

const app: Express = express();

// Standard hardening headers (clickjacking, MIME sniffing, referrer leakage, etc.).
// CSP is left off for now since the built SPA hasn't been audited against a strict
// policy; the other protections are safe defaults that don't change app behavior.
app.use(helmet({ contentSecurityPolicy: false }));

// This app is intended for internal LAN use only, served same-origin (the API and
// the built frontend share one origin in production). Cross-origin browser access
// is only needed for local development against a separate Vite dev server, so CORS
// is scoped to development — in production no Access-Control-Allow-Origin header is
// sent, which stops any other website from reading this API from a LAN user's browser.
if (process.env["NODE_ENV"] !== "production") {
  app.use(cors({ origin: true, credentials: true }));
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const flyerDirectory = path.resolve(
  process.env["ANNOUNCEMENT_UPLOAD_DIR"] ?? path.join(process.cwd(), "uploads", "announcements"),
);
mkdirSync(flyerDirectory, { recursive: true });
app.use(
  "/uploads/announcements",
  requireSession,
  express.static(flyerDirectory, {
    index: false,
    fallthrough: false,
    maxAge: 0,
    immutable: false,
    setHeaders(res) {
      res.setHeader("Cache-Control", "private, no-store");
    },
  }),
);

// Every API response can carry sensitive, per-user data. Tell browsers and any
// intermediate network cache (corporate proxies, LAN caching appliances) never to
// store or reuse these responses, so a stale cached copy can never be replayed to
// someone who shouldn't see it.
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use("/api", router);

// Serve built frontend static files when STATIC_DIR is set (production)
const staticDir = process.env["STATIC_DIR"];
if (staticDir && existsSync(staticDir)) {
  logger.info({ staticDir }, "Serving static frontend files");
  app.use(express.static(staticDir));
  // SPA fallback — serve index.html for any non-API route
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
} else if (staticDir) {
  logger.warn({ staticDir }, "STATIC_DIR is set but directory does not exist — skipping static serving");
}

// Centralized error handler: log the full error server-side, but never leak stack
// traces or internal error details to the client, regardless of NODE_ENV.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  req.log?.error({ err }, "Unhandled request error");
  if (res.headersSent) return;
  res.status(500).json({ error: "An unexpected error occurred." });
});

export default app;
