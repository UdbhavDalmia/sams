/**
 * Robust fetch utility with automatic retries, exponential backoff, and timeouts.
 * Helps prevent UI lockups or failed requests due to transient connection resets.
 */

export interface FetchWithRetryOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  backoffFactor?: number;
  initialDelayMs?: number;
}

export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    timeoutMs = 45000, // 45 seconds default timeout
    retries = 3,       // Retry 3 times
    backoffFactor = 2, // Double the delay each time
    initialDelayMs = 500, // Start with 500ms delay
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(id);

      // Retry on transient server errors (like 502/503/504 gateway issues)
      if (
        !response.ok &&
        (response.status === 502 || response.status === 503 || response.status === 504) &&
        attempt < retries
      ) {
        console.warn(
          `[API Fetch] Transient server error ${response.status} on ${url}. Retrying attempt ${attempt + 1}/${retries} in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= backoffFactor;
        continue;
      }

      return response;
    } catch (error: any) {
      clearTimeout(id);
      lastError = error;

      const isAbort = error.name === "AbortError";
      const errorMessage = isAbort ? "Request timeout" : error.message || "Network error";

      if (attempt < retries) {
        console.warn(
          `[API Fetch] ${errorMessage} on ${url}. Retrying attempt ${attempt + 1}/${retries} in ${delay}ms...`,
          error
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= backoffFactor;
      } else {
        console.error(`[API Fetch] All ${retries + 1} attempts failed for ${url}:`, error);
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${retries} retries`);
}
