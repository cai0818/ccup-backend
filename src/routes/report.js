import Router from "koa-router";
import { createReport, getReportTemplateList, getReportFormData, saveReportData, submitReport, getCurrentUserReports, getPendingReviewReports, deleteReport, withdrawReport, approveReport, rejectReport, mintReport, searchReports, getAllReports } from "../controllers/report.js";
import { checkLoggedIn, checkAccountVerified, checkRole } from "../middlewares/auth.js";
import { getNftTokenData } from "../controllers/wallet.js";

const router = new Router();

router.get("/", checkLoggedIn, checkAccountVerified, checkRole([0, 2, 3]), getCurrentUserReports, getAllReports);

router.post("/create/:templateId", checkLoggedIn, checkAccountVerified, checkRole([0]), createReport);
router.post("/delete/:reportUUID", checkLoggedIn, checkAccountVerified, checkRole([0]), deleteReport);
router.post("/approve/:reportUUID", checkLoggedIn, checkAccountVerified, checkRole([1]), approveReport);
router.post("/reject/:reportUUID", checkLoggedIn, checkAccountVerified, checkRole([1]), rejectReport);
router.post("/withdraw/:reportUUID", checkLoggedIn, checkAccountVerified, checkRole([0]), withdrawReport);

router.get("/templateList", checkLoggedIn, checkAccountVerified, getReportTemplateList);
router.get("/formData/:reportUUID", checkLoggedIn, checkAccountVerified, checkRole([0, 1, 2, 3]), getReportFormData);
router.post("/save/:reportUUID", checkLoggedIn, checkAccountVerified, checkRole([0]), saveReportData);
router.post("/submit/:reportUUID", checkLoggedIn, checkAccountVerified, checkRole([0]), submitReport);

router.get("/pendingReview", checkLoggedIn, checkAccountVerified, checkRole([1]), getPendingReviewReports);

router.post("/mint/:reportUUID", checkLoggedIn, checkAccountVerified, checkRole([0]), mintReport);

router.get("/search", checkLoggedIn, checkAccountVerified, searchReports);

router.get("/token/:tokenId", checkLoggedIn, checkAccountVerified, checkRole([0, 1, 2, 3]), getNftTokenData);

export default router;
