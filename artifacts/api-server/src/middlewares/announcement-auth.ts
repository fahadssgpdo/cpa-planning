import type { Request, RequestHandler, Response } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const COOKIE_NAME = "cpa_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const planningRoles = new Set<PlatformRole>(["officer", "manager", "admin"]);

type SessionPayload = { userId: number; expiresAt: number };
export type PlatformRole = "employee" | "officer" | "manager" | "admin";
export type SessionUser = {
  id: number;
  nameAr: string;
  username: string | null;
  designation: string | null;
  role: PlatformRole;
};

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

function isPlatformRole(role: string): role is PlatformRole {
  return role === "employee" || role === "officer" || role === "manager" || role === "admin";
}

function hasTrustedOrigin(req: Request) {
  const origin = req.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).host === req.get("host");
  } catch {
    return false;
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

export const requireSession: RequestHandler = async (req, res, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && !hasTrustedOrigin(req)) {
    res.status(403).json({ error: "Cross-site requests are not allowed." });
    return;
  }

  const session = decodeSession(req.cookies?.[COOKIE_NAME] as string | undefined);
  if (!session) {
    res.status(401).json({ error: "Authentication is required." });
    return;
  }

  const [user] = await db
    .select({
      id: usersTable.id,
      nameAr: usersTable.nameAr,
      username: usersTable.username,
      designation: usersTable.designation,
      role: usersTable.role,
      active: usersTable.active,
    })
    .from(usersTable)
    .where(eq(usersTable.id, session.userId))
    .limit(1);
  if (!user?.active || !isPlatformRole(user.role)) {
    res.status(401).json({ error: "Authentication is required." });
    return;
  }

  res.locals.sessionUser = {
    id: user.id,
    nameAr: user.nameAr,
    username: user.username,
    designation: user.designation,
    role: user.role,
  } satisfies SessionUser;
  next();
};

export function requireRoles(...allowedRoles: PlatformRole[]): RequestHandler {
  return (_req, res, next) => {
    const user = res.locals.sessionUser as SessionUser | undefined;
    if (!user) {
      res.status(401).json({ error: "Authentication is required." });
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({ error: "You do not have permission for this action." });
      return;
    }
    next();
  };
}

export const requirePlanningStaff = requireRoles("officer", "manager", "admin");

export function requireManagerOrAdmin(req: Request, res: Response) {
  const user = getSessionUser(res);
  if (user.role !== "manager" && user.role !== "admin") {
    res.status(403).json({ error: "Manager or administrator authorization is required." });
    return false;
  }
  return true;
}

export function getSessionUser(res: Response): SessionUser {
  const user = res.locals.sessionUser as SessionUser | undefined;
  if (!user) throw new Error("Authenticated route is missing a session user.");
  return user;
}

export function isPlanningStaff(user: SessionUser) {
  return planningRoles.has(user.role);
}