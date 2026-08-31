import { Router } from "express";
import { createTag, deleteTag, listTags, updateTag } from "../controllers/taxonomyController.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { contentTaxonomySchema } from "../validation/schemas.js";

const router = Router();
router.get("/", listTags);
router.post("/", requireAdmin, validate(contentTaxonomySchema), createTag);
router.put("/:id", requireAdmin, validate(contentTaxonomySchema.partial()), updateTag);
router.delete("/:id", requireAdmin, deleteTag);
export default router;
