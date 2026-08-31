import { Router } from "express";
import multer from "multer";
import { listMedia, removeMedia, uploadMedia } from "../controllers/mediaController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } });

router.use(requireAdmin);
router.get("/", listMedia);
router.post("/", upload.single("file"), uploadMedia);
router.delete("/:id", removeMedia);

export default router;
