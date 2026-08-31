import { Router } from "express";
import { createSeries, deleteSeries, getSeries, listSeries, updateSeries } from "../controllers/taxonomyController.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { contentTaxonomySchema } from "../validation/schemas.js";

const router = Router();
router.get("/", listSeries);
router.get("/:slug", getSeries);
router.post("/", requireAdmin, validate(contentTaxonomySchema), createSeries);
router.put("/:id", requireAdmin, validate(contentTaxonomySchema.partial()), updateSeries);
router.delete("/:id", requireAdmin, deleteSeries);
export default router;
