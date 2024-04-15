import Router from "koa-router";
import { buyItem, buyRequest, getMarketplaceList, sellRequest, unlistItem, getCurrentUserOrders, getCurrentUserMarketplaceItems, getOrderDetails, confirmOrderPayment } from "../controllers/marketplace.js"
import { checkLoggedIn, checkAccountVerified, checkRole } from "../middlewares/auth.js";

const router = new Router();


router.get("/", checkLoggedIn, checkAccountVerified, checkRole([0,3]), getMarketplaceList);
router.post("/sellRequest", checkLoggedIn, checkAccountVerified, checkRole([0,3]), sellRequest);
router.post("/buyRequest", checkLoggedIn, checkAccountVerified, checkRole([0,3]), buyRequest);

router.get("/order/:id", checkLoggedIn, checkAccountVerified, checkRole([0,3]), getOrderDetails);
router.post("/order/:id/confirmPayment", checkLoggedIn, checkAccountVerified, checkRole([0,3]), confirmOrderPayment);
router.delete("/:id", checkLoggedIn, checkAccountVerified, checkRole([0,3]), unlistItem);
router.post("/buy/:id", checkLoggedIn, checkAccountVerified, checkRole([0,3]), buyItem);

router.get("/orders", checkLoggedIn, checkAccountVerified, checkRole([0,3]), getCurrentUserOrders);
router.get("/items", checkLoggedIn, checkAccountVerified, checkRole([0,3]), getCurrentUserMarketplaceItems);

export default router;