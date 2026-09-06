import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, licenseBindingsTable, userLicensesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/clerk";
import { decryptField } from "../lib/crypto";

const router: IRouter = Router();

// GET /account/licenses
// Returns all licenses linked to the authenticated user's account.
router.get("/account/licenses", requireAuth, async (req, res, next) => {
  try {
    const clerkUserId = res.locals.clerkUserId as string;

    const rows = await db
      .select({
        id: userLicensesTable.id,
        licenseKeyLookupHash: userLicensesTable.licenseKeyLookupHash,
        createdAt: userLicensesTable.createdAt,
        status: licenseBindingsTable.status,
        packCallBalance: licenseBindingsTable.packCallBalance,
        boundAt: licenseBindingsTable.boundAt,
        licenseKeyEncrypted: licenseBindingsTable.licenseKeyEncrypted,
      })
      .from(userLicensesTable)
      .leftJoin(
        licenseBindingsTable,
        eq(
          userLicensesTable.licenseKeyLookupHash,
          licenseBindingsTable.licenseKeyLookupHash,
        ),
      )
      .where(eq(userLicensesTable.clerkUserId, clerkUserId));

    const licenses = rows.map((row) => {
      let licenseKey: string | null = null;
      if (row.licenseKeyEncrypted) {
        try {
          licenseKey = decryptField(row.licenseKeyEncrypted);
        } catch {
          licenseKey = null;
        }
      }
      return {
        id: row.id,
        licenseKey,
        status: row.status ?? "unknown",
        packCallBalance: row.packCallBalance ?? 0,
        boundAt: row.boundAt,
        linkedAt: row.createdAt,
      };
    });

    res.json({ licenses });
  } catch (err) {
    next(err);
  }
});

export default router;
