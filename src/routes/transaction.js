import Router from "koa-router";
import { getTransaction, getTransactions, getCompanyTransactions } from "../controllers/transaction.js";
import { checkLoggedIn, checkAccountVerified, checkRole } from "../middlewares/auth.js";

const router = new Router();

router.get("/", checkLoggedIn, checkAccountVerified, getTransaction);
router.get("/all", checkLoggedIn, checkAccountVerified, getTransactions);
router.get("/search", checkLoggedIn, checkAccountVerified, getCompanyTransactions);

export default router;