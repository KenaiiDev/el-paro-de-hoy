import { redis } from "@/lib/redis";
import { SectorId, SectorStatus } from "@/types/strike";
import { SECTORS } from "@/lib/sectors";

const cacheKey = (id: SectorId) => `strike:v2:${id}`;

export const SectorService = {
  async getStatus(id: SectorId): Promise<SectorStatus | null> {
    return await redis.get<SectorStatus>(cacheKey(id));
  },

  async getAllStatuses(): Promise<SectorStatus[]> {
    const results = await Promise.all(
      SECTORS.map((s) => redis.get<SectorStatus>(cacheKey(s.id)))
    );
    return results.filter((r): r is SectorStatus => r !== null);
  },

  async updateStatus(id: SectorId, data: SectorStatus): Promise<void> {
    await redis.set(cacheKey(id), data);
  },
};
