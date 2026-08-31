import { Router } from "express";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createCategorySchema, updateCategorySchema } from "../validation/schemas.js";

const router = Router();

router.get("/", listCategories);
router.post("/", requireAdmin, validate(createCategorySchema), createCategory);
router.put("/:id", requireAdmin, validate(updateCategorySchema), updateCategory);
router.delete("/:id", requireAdmin, deleteCategory);

export default router;
