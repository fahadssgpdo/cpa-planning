import type { RequestHandler } from "express";

type RateLimitOptions = {
  windowMs: number;
  max: number;
  name: string;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function clientKey(req: Parameters<RequestHandler>[0], name: string) {
  return `${name}:${req.ip || req.socket.remoteAddress || "unknown"}`;
}

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  while (buckets.size > MAX_BUCKETS) {
    const first = buckets.keys().next().value;
    if (first === undefined) break;
    buckets.delete(first);
  }
}

export function rateLimit({ windowMs, max, name }: RateLimitOptions): RequestHandler {
  return (req, res, next) => {
    const now = Date.now();
    prune(now);
    const key = clientKey(req, name);
    const current = buckets.get(key);
    const bucket = current && current.resetAt > now
      ? current
      : { count: 0, resetAt: now + windowMs };

    bucket.count += 1;
    buckets.set(key, bucket);
    const remaining = Math.max(0, max - bucket.count);
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));

    if (bucket.count > max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      req.log.warn({ limiter: name, retryAfter }, "Rate limit exceeded");
      res.status(429).json({ error: "Too many requests. Please try again later." });
      return;
    }

    next();
  };
}

export const authRateLimit = rateLimit({ name: "auth", windowMs: 15 * 60 * 1000, max: 20 });
export const userMutationRateLimit = rateLimit({ name: "user-mutation", windowMs: 15 * 60 * 1000, max: 60 });