const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Serializa las llamadas y garantiza al menos `minIntervalMs` entre el
 * inicio de una y el de la siguiente, aunque se invoquen en paralelo.
 */
export function createThrottle(minIntervalMs: number) {
  let queue: Promise<unknown> = Promise.resolve();
  let lastStart = 0;

  return function throttle<T>(fn: () => Promise<T>): Promise<T> {
    const run = queue.then(async () => {
      const wait = lastStart + minIntervalMs - Date.now();
      if (wait > 0) await sleep(wait);
      lastStart = Date.now();
      return fn();
    });
    // La cola sigue aunque una llamada falle.
    queue = run.catch(() => undefined);
    return run;
  };
}

export interface RetryOptions {
  retries: number;
  baseDelayMs: number;
  shouldRetry: (error: unknown) => boolean;
}

/** Reintenta con espera exponencial (base, base*2, ...) mientras `shouldRetry` lo permita. */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= options.retries || !options.shouldRetry(error)) throw error;
      await sleep(options.baseDelayMs * 2 ** attempt);
    }
  }
}
