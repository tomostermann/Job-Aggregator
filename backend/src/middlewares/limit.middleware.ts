import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 3 * 60 * 1000,
  max: 3,
  message: { message: "Trop de tentatives, réessayez dans 3 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});
