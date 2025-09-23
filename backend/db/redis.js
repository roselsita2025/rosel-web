import Redis from "ioredis"
import '../utils/env.js';

export const redis = new Redis(process.env.UPSTASH_REDIS_URL);

