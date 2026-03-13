import rateLimit from "./rate-limit";

// 10 requests per minute for extraction endpoints
export const extractLimiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

// 20 requests per minute for generation endpoints
export const generateLimiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });

// 60 requests per minute for transpile
export const transpileLimiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 });
