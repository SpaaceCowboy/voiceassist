import { Router } from "express";
import { subscribeToNewsletter } from "../controllers/newsletterController.js";
import { validate } from "../middleware/validate.js";
import { newsletterRateLimit } from "../middleware/security.js";
import { newsletterSubscribeSchema } from "../validation/schemas.js";

const router = Router();

router.post("/subscribers", newsletterRateLimit, validate(newsletterSubscribeSchema), subscribeToNewsletter);

export default router;
