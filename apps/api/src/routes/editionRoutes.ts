import { Router } from "express";
import { createEdition, deleteEdition, getCurrentEdition, getEdition, listAdminEditions, listEditions, updateEdition } from "../controllers/editionController.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { editionSchema, updateEditionSchema } from "../validation/schemas.js";

const router = Router();
router.get("/", listEditions);
router.get("/current", getCurrentEdition);
router.get("/admin", requireAdmin, listAdminEditions);
router.post("/admin", requireAdmin, validate(editionSchema), createEdition);
router.put("/admin/:id", requireAdmin, validate(updateEditionSchema), updateEdition);
router.delete("/admin/:id", requireAdmin, deleteEdition);
router.get("/:slug", getEdition);
export default router;
