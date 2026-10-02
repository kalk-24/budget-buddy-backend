import { Router } from "express";
import { protect } from "../middleware/auth.js";
import c from "../controllers/expenseController.js";

const router = Router();
router.use(protect);

router.get("/", c.getAll);
router.get("/:id", c.getOne);
router.post("/", c.create);
router.patch("/:id", c.update);
router.delete("/:id", c.remove);

export default router;