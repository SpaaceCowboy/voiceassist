import { Router } from "express";
import { approveComment, deleteComment, listAdminComments, listPublicComments } from "../controllers/commentController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();
router.get("/", listPublicComments);
router.get("/admin", requireAdmin, listAdminComments);
router.put("/:id/approve", requireAdmin, approveComment);
router.delete("/:id", requireAdmin, deleteComment);
export default router;
