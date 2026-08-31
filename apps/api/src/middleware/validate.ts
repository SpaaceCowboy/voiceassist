import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

/**
 * Middleware factory that validates a request part against a Zod schema.
 * On failure, throws a ZodError which the centralized error handler turns
 * into a 400 response.
 */
export function validate(schema: ZodSchema, part: "body" | "query" = "body"): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(result.error);
      return;
    }
    // Express 5 exposes `req.query` through a getter that reparses on access.
    // Define a request-local value so downstream handlers receive Zod's
    // coerced query values.
    if (part === "query") {
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else {
      req.body = result.data;
    }
    next();
  };
}
