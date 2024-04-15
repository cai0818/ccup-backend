import Router from "koa-router";
import { claimQuota, getLastClaimQuotaDate } from "../controllers/quota.js";
import { checkLoggedIn, checkAccountVerified, checkRole } from "../middlewares/auth.js";

const router = new Router();

router.post("/claim", checkLoggedIn, checkAccountVerified, checkRole([0]), claimQuota);
router.get("/lastClaim", checkLoggedIn, checkAccountVerified, checkRole([0]), getLastClaimQuotaDate);

export default router;