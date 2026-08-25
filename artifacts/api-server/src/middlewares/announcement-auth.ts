import type { RequestHandler, Response } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const COOKIE_NAME = "cpa_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const allowedRoles = new Set(["officer", "manager", "admin"]);

type SessionPayload = { userId: number; expiresAt: number };

function secret() {
  const value = process.env["SESSION_SECRET"];
  if (!value) throw new Error("SESSION_SECRET is required for authenticated requests.");
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function decodeSession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  const expectedSignature = sign(encodedPayload);
  const received = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;
    return Number.isInteger(payload.userId) && payload.expiresAt > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

export function issueSession(response: Response, userId: number) {
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt: Date.now() + SESSION_TTL_MS })).toString("base64url");
  response.cookie(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

export function clearSession(response: Response) {
  response.clearCookie(COOKIE_NAME, { httpOnly: true, secure: process.env["NODE_ENV"] === "production", sameSite: "lax", path: "/" });
}

export const requireAnnouncementManager: RequestHandler = async (req, res, next) => {
  const origin = req.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== req.get("host")) {
        res.status(403).json({ error: "Cross-site requests are not allowed." });
        return;
      }
    } catch {
      res.status(403).json({ error: "Invalid request origin." });
      return;
    }
  }

  const session = decodeSession(req.cookies?.[COOKIE_NAME] as string | undefined);
  if (!session) {
    res.status(401).json({ error: "Authentication is required." });
    return;
  }

  const [user] = await db
    .select({ id: usersTable.id, role: usersTable.role, active: usersTable.active })
    .from(usersTable)
    .where(eq(usersTable.id, session.userId))
    .limit(1);
  if (!user?.active) {
    res.status(401).json({ error: "Authentication is required." });
    return;
  }
  if (!allowedRoles.has(user.role)) {
    res.status(403).json({ error: "Planning staff authorization is required." });
    return;
  }

  res.locals.announcementUserId = user.id;
  next();
};