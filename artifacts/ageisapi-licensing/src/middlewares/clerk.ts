import { clerkMiddleware, getAuth } from "@clerk/express";
import type { RequestHandler, Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, appUsersTable } from "@workspace/db";

export { clerkMiddleware };

async function getOrCreateAppUser(clerkUserId: string) {
  const [existing] = await db
    .select()
    .from(appUsersTable)
    .where(eq(appUsersTable.clerkUserId, clerkUserId))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(appUsersTable)
    .values({ clerkUserId })
    .returning();
  return created;
}

export const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "unauthenticated" });
    return;
  }

  try {
    const appUser = await getOrCreateAppUser(userId);

    if (appUser.revokedAt) {
      res.status(403).json({ error: "account_revoked" });
      return;
    }
    if (appUser.suspended) {
      res.status(403).json({ error: "account_suspended" });
      return;
    }

    res.locals.clerkUserId = userId;
    res.locals.appUserId = appUser.id;
    next();
  } catch (err) {
    next(err);
  }
};
