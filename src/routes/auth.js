import Router from "koa-router";

import { login, register, logout, getLoginState } from "../controllers/auth.js";
import { checkLoggedIn, checkUnloggedIn } from "../middlewares/auth.js";

const router = new Router();

router.post("/login", checkUnloggedIn, login);
router.post("/register", checkUnloggedIn, register);
router.post("/logout", checkLoggedIn, logout);
router.get("/state", checkLoggedIn, getLoginState);//检测是否登录



export default router;