import { Router } from "express";
import { listAuthors } from "../controllers/authorController.js";

const router = Router();

router.get("/", listAuthors);

export default router;