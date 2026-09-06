import express, { type Express } from "express";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "./middlewares/clerk.js";
import router from "./routes/index.js";
import webhookRouter from "./routes/webhook.js";
import stripeWebhookRouter from "./routes/stripe-webhook.js";
import { logger } from "./lib/logger.js";

const app: Express = express();
app.disable("x-powered-by");

if (process.env["NODE_ENV"] !== "production") {
  app.use((_req, res) => {
    res.status(503).json({ error: "Local server disabled. Use https://aegisapi.net" });
  });
}

app.set("trust proxy", 1);

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

// Raw-body webhooks must be mounted BEFORE express.json() so the body
// isn't parsed as JSON first. Both Svix (Clerk) and Stripe require the
// raw Buffer for signature verification.
app.use("/api/clerk/webhook", express.raw({ type: "application/json" }), webhookRouter);
app.use("/licensing/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookRouter);

// Standard body parsing + Clerk session middleware for all other routes.
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: true, limit: "32kb" }));
app.use(
  clerkMiddleware({
    publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
  }),
);

app.use("/licensing", router);

export default app;
