import { redis } from "@/lib/redis";
import { StrikeStatus } from "@/types/strike";

const STRIKE_PREFIX = "strike:v1";
const STRIKE_CACHE_KEY = `${STRIKE_PREFIX}:current_strike_status`;

export const StrikeService = {
  async getStatus(): Promise<StrikeStatus | null> {
    return await redis.get<StrikeStatus>(STRIKE_CACHE_KEY);
  },

  async updateStatus(data: StrikeStatus): Promise<void> {
    await redis.set(STRIKE_CACHE_KEY, data);
  },
};
