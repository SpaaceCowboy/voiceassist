import rateLimit from "express-rate-limit";

const rateLimitResponse = {
  error: { code: "RATE_LIMITED", message: "Too many requests; please try again later" },
};

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (req) => req.path === "/api/health",
  message: rateLimitResponse,
});

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: rateLimitResponse,
});

export const newsletterRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: rateLimitResponse,
});

export const commentRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: rateLimitResponse,
});
