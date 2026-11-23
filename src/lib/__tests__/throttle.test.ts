import { describe, expect, it } from "vitest";
import { createThrottle, withRetry } from "@/lib/throttle";

describe("createThrottle", () => {
  it("espacia las llamadas paralelas al menos el intervalo mínimo", async () => {
    const throttle = createThrottle(30);
    const starts: number[] = [];

    await Promise.all(
      [1, 2, 3].map(() =>
        throttle(async () => {
          starts.push(Date.now());
        })
      )
    );

    expect(starts).toHaveLength(3);
    for (let i = 1; i < starts.length; i++) {
      expect(starts[i] - starts[i - 1]).toBeGreaterThanOrEqual(28);
    }
  });

  it("sigue procesando la cola después de un error", async () => {
    const throttle = createThrottle(1);
    await expect(throttle(async () => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
    await expect(throttle(async () => "ok")).resolves.toBe("ok");
  });
});

describe("withRetry", () => {
  it("reintenta errores recuperables hasta tener éxito", async () => {
    let calls = 0;
    const result = await withRetry(
      async () => {
        calls++;
        if (calls < 3) throw new Error("429");
        return "ok";
      },
      { retries: 2, baseDelayMs: 1, shouldRetry: () => true }
    );
    expect(result).toBe("ok");
    expect(calls).toBe(3);
  });

  it("no reintenta errores no recuperables", async () => {
    let calls = 0;
    await expect(
      withRetry(
        async () => {
          calls++;
          throw new Error("404");
        },
        { retries: 2, baseDelayMs: 1, shouldRetry: () => false }
      )
    ).rejects.toThrow("404");
    expect(calls).toBe(1);
  });

  it("se rinde después de agotar los reintentos", async () => {
    let calls = 0;
    await expect(
      withRetry(
        async () => {
          calls++;
          throw new Error("429");
        },
        { retries: 2, baseDelayMs: 1, shouldRetry: () => true }
      )
    ).rejects.toThrow("429");
    expect(calls).toBe(3);
  });
});
