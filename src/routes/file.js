import Router from "koa-router";
import { deleteFile, uploadFile, getUserAccountFiles, downloadFile } from "../controllers/file.js";
import { checkLoggedIn } from "../middlewares/auth.js";

const router = new Router();

// For test only, auth is needed
router.post("/upload/:fileType", checkLoggedIn, uploadFile);
router.post("/delete/:fileType", checkLoggedIn, deleteFile);
router.get("/list/accountVerify", checkLoggedIn, getUserAccountFiles);
router.get("/download/:fileType", checkLoggedIn, downloadFile);

export default router;