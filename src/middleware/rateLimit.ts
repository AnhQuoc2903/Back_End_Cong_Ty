import rateLimit from "express-rate-limit";

export const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Quá nhiều lần thử. Vui lòng thử lại sau.",
  },
});
