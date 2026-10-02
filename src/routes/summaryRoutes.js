import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { getSummary } from "../controllers/summaryController.js";

const router = Router();
router.get("/", protect, getSummary);

export default router;