import { describe, expect, it } from "vitest";
import { mapSettled } from "@/lib/concurrency";

describe("mapSettled", () => {
  it("respeta el orden y no corta por un error", async () => {
    const results = await mapSettled([1, 2, 3], 2, async (n) => {
      if (n === 2) throw new Error("boom");
      return n * 10;
    });

    expect(results[0]).toEqual({ status: "fulfilled", value: 10 });
    expect(results[1].status).toBe("rejected");
    expect(results[2]).toEqual({ status: "fulfilled", value: 30 });
  });

  it("no supera el límite de concurrencia", async () => {
    let running = 0;
    let peak = 0;
    await mapSettled([1, 2, 3, 4, 5, 6], 3, async () => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((r) => setTimeout(r, 5));
      running--;
    });
    expect(peak).toBe(3);
  });
});
