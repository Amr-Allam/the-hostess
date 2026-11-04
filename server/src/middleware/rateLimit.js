import rateLimit from "express-rate-limit";
import { httpError } from "../utils/httpError.js";

function createLimiter({ windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => next(httpError(429, message)),
  });
}

export const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Too many login attempts, please try again later",
});

// Looser than login: diners on the restaurant's Wi-Fi share one IP.
export const orderLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: "Too many orders, please try again later",
});

// Looser still: the booking form asks again on every date or party-size change.
export const availabilityLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  message: "Too many requests, please try again later",
});
