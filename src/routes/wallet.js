import Router from "koa-router";

import { bindWallet, getWalletAddress } from "../controllers/wallet.js";
import { checkLoggedIn } from "../middlewares/auth.js";

const router = new Router();

router.post("/bind", checkLoggedIn, bindWallet);
router.get("/address", checkLoggedIn, getWalletAddress);

export default router;