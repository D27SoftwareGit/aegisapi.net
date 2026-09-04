import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import licenseRouter from "./license.js";
import adminRouter from "./admin.js";
import accountRouter from "./account.js";
import checkoutRouter from "./checkout.js";
import redeemRouter from "./redeem.js";
import purchasesRouter from "./purchases.js";
import userRouter from "./user.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/admin", adminRouter);
router.use(licenseRouter);
router.use(accountRouter);
router.use(checkoutRouter);
router.use(redeemRouter);
router.use(purchasesRouter);
router.use(userRouter);

export default router;
