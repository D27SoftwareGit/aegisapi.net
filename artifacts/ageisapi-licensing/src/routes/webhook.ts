import { Router, type IRouter } from "express";
import { Webhook } from "svix";
import { eq } from "drizzle-orm";
import { db, appUsersTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/api/clerk/webhook", async (req, res) => {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    logger.error("CLERK_WEBHOOK_SECRET not set");
    res.status(500).json({ error: "webhook_not_configured" });
    return;
  }

  const svixId = req.headers["svix-id"] as string;
  const svixTimestamp = req.headers["svix-timestamp"] as string;
  const svixSignature = req.headers["svix-signature"] as string;

  if (!svixId || !svixTimestamp || !svixSignature) {
    res.status(400).json({ error: "missing_svix_headers" });
    return;
  }

  let payload: { type: string; data: Record<string, unknown> };
  try {
    const wh = new Webhook(secret);
    payload = wh.verify(req.body as Buffer, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof payload;
  } catch (err) {
    logger.warn({ err }, "Webhook signature verification failed");
    res.status(400).json({ error: "invalid_signature" });
    return;
  }

  if (payload.type === "user.deleted") {
    const clerkUserId = payload.data.id as string;
    if (clerkUserId) {
      await db
        .update(appUsersTable)
        .set({ revokedAt: new Date() })
        .where(eq(appUsersTable.clerkUserId, clerkUserId));
      logger.info({ clerkUserId }, "User deleted — account revoked");
    }
  }

  res.json({ received: true });
});

export default router;
