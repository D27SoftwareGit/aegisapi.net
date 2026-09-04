import type { NextFunction, Request, Response } from "express";
import crypto from "node:crypto";

const KEY_ENV = "AEGISAPI_LICENSING_ADMIN_KEY";

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env[KEY_ENV];
  if (!expected) {
    req.log.error(`${KEY_ENV} is not configured; refusing all admin requests.`);
    res.status(500).json({ error: "admin_not_configured" });
    return;
  }

  const header = req.headers.authorization;
  const provided = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (
    !provided ||
    provided.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  ) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  next();
}
