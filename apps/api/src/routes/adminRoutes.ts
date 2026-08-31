import { Router } from "express";
import { getAdminSession, loginAdmin, logoutAdmin } from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/auth.js";
import { loginRateLimit } from "../middleware/security.js";
import { validate } from "../middleware/validate.js";
import { adminLoginSchema } from "../validation/schemas.js";

const router = Router();

router.post("/login", loginRateLimit, validate(adminLoginSchema), loginAdmin);
router.post("/logout", requireAdmin, logoutAdmin);
router.get("/session", requireAdmin, getAdminSession);

export default router;
