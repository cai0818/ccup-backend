import Router from "koa-router";

import {adjustAnnualQuota, approveAccountVerify, changeUserPassword, changeUserProfile, getAllUsers, getLatestAccountVerifyRequest, rejectAccountVerify, saveCompanyProfile, setUserRole, submitAccountVerify} from "../controllers/user.js";
import { checkUnloggedIn, checkLoggedIn, checkRole } from "../middlewares/auth.js";

const router = new Router();

router.get("/", checkLoggedIn, checkRole([2,3]), getAllUsers);
router.post("/changeProfile", checkLoggedIn, changeUserProfile);
router.post("/changePassword", checkLoggedIn, changeUserPassword);
router.post("/saveCompanyProfile", checkLoggedIn, saveCompanyProfile);
router.post("/verify", checkLoggedIn, submitAccountVerify);
router.get("/verify", checkLoggedIn, getLatestAccountVerifyRequest);
router.post("/verify/approve/:id", checkLoggedIn, checkRole([3]), approveAccountVerify);
router.post("/verify/reject/:id", checkLoggedIn, checkRole([3]), rejectAccountVerify);
router.post("/annualQuota/:id", checkLoggedIn, checkRole([3]), adjustAnnualQuota);
router.post("/role/:id", checkLoggedIn, checkRole([3]), setUserRole);

export default router;