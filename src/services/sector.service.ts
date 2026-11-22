import { unstable_cache, revalidateTag } from "next/cache";
import { redis } from "@/lib/redis";
import { SectorId, SectorStatus } from "@/types/strike";
import { SECTORS } from "@/lib/sectors";
import { isTodayInBuenosAires } from "@/lib/time";

const cacheKey = (id: SectorId) => `strike:v2:${id}`;

/** Los estados sólo valen para el día; el TTL limpia lo que quede colgado. */
const STATUS_TTL_SECONDS = 48 * 60 * 60;

export const STATUSES_CACHE_TAG = "sector-statuses";

const readAllFromRedis = unstable_cache(
  async (): Promise<(SectorStatus | null)[]> =>
    redis.mget<(SectorStatus | null)[]>(...SECTORS.map((s) => cacheKey(s.id))),
  ["sector-statuses"],
  { revalidate: 60, tags: [STATUSES_CACHE_TAG] }
);

export function isStatusFresh(status: SectorStatus, now: Date = new Date()): boolean {
  return isTodayInBuenosAires(status.lastUpdate, now);
}

export const SectorService = {
  /**
   * Devuelve sólo los estados actualizados hoy (hora de Buenos Aires).
   * Un estado de ayer no debe mostrarse como vigente.
   */
  async getFreshStatuses(now: Date = new Date()): Promise<SectorStatus[]> {
    try {
      const results = await readAllFromRedis();
      return results.filter(
        (r): r is SectorStatus => r !== null && isStatusFresh(r, now)
      );
    } catch (error) {
      console.error("[SectorService] Error leyendo estados:", error);
      return [];
    }
  },

  async updateStatus(id: SectorId, data: SectorStatus): Promise<void> {
    await redis.set(cacheKey(id), data, { ex: STATUS_TTL_SECONDS });
  },

  invalidateCache(): void {
    revalidateTag(STATUSES_CACHE_TAG, { expire: 0 });
  },
};
