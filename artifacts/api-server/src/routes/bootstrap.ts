import { Router, type IRouter } from "express";
import { isNotNull, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";

const router: IRouter = Router();

/**
 * POST /api/internal/bootstrap
 *
 * One-time seed of demo usernames + passwords.
 * Self-disabling: returns 409 the moment any user already has a password set.
 */
router.post("/internal/bootstrap", async (req, res): Promise<void> => {
  const alreadySeeded = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(isNotNull(usersTable.passwordHash))
    .limit(1);

  if (alreadySeeded.length > 0) {
    res.status(409).json({
      error: "already_bootstrapped",
      message: "Users already have passwords — bootstrap is disabled.",
    });
    return;
  }

  const seeds = [
    { id: 1, username: "salem.harthi",   password: "Salem@1234"  },
    { id: 2, username: "mariam.balushi", password: "Mariam@1234" },
    { id: 3, username: "khalid.riyami",  password: "Khalid@1234" },
    { id: 4, username: "admin",          password: "Admin@1234"  },
    { id: 5, username: "fatima.saadia",  password: "Fatima@1234" },
    { id: 6, username: "omar.mamari",    password: "Omar@1234"   },
  ];

  const results: { id: number; username: string; ok: boolean }[] = [];

  for (const seed of seeds) {
    try {
      const hash = await bcrypt.hash(seed.password, 12);
      await db
        .update(usersTable)
        .set({ username: seed.username, passwordHash: hash })
        .where(eq(usersTable.id, seed.id));
      results.push({ id: seed.id, username: seed.username, ok: true });
    } catch {
      results.push({ id: seed.id, username: seed.username, ok: false });
    }
  }

  res.json({ bootstrapped: true, users: results });
});

export default router;
