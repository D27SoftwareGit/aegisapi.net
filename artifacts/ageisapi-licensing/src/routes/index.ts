import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import accountRouter from "./account.js";
import checkoutRouter from "./checkout.js";
import redeemRouter from "./redeem.js";
import purchasesRouter from "./purchases.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(accountRouter);
router.use(checkoutRouter);
router.use(redeemRouter);
router.use(purchasesRouter);

export default router;
