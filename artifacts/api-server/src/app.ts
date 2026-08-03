import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import { existsSync } from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

export default app;
