import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, appUsersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/clerk.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

const profileSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().optional(),
  marketingOptIn: z.boolean().optional(),
});

// PATCH /licensing/user/profile
// Stores name, email, and marketing preference captured at sign-up.
router.patch("/user/profile", requireAuth, async (req, res, next) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.issues });
    return;
  }

  const clerkUserId = res.locals.clerkUserId as string;
  const { firstName, lastName, email, marketingOptIn } = parsed.data;

  try {
    await db
      .update(appUsersTable)
      .set({
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
        ...(marketingOptIn !== undefined && { marketingOptIn }),
      })
      .where(eq(appUsersTable.clerkUserId, clerkUserId));

    logger.info({ clerkUserId, marketingOptIn }, "User profile updated");
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err, clerkUserId }, "Failed to update user profile");
    next(err);
  }
});

export default router;
