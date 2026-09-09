const origin = new URL(process.env.RELEASE_URL || "http://localhost:3000");
const concurrency = Math.max(1, Math.min(100, Number(process.env.LOAD_CONCURRENCY || 10)));
const requests = Math.max(concurrency, Math.min(5000, Number(process.env.LOAD_REQUESTS || 100)));
const paths = ["/", "/planners", "/demo/riviera", "/api/health"];
let cursor = 0;
const timings = [];
const failures = [];

async function worker() {
  while (cursor < requests) {
    const index = cursor++;
    const pathname = paths[index % paths.length];
    const started = performance.now();
    try {
      const response = await fetch(new URL(pathname, origin), {
        signal: AbortSignal.timeout(15000),
        headers: { "user-agent": "vow-motion-capacity-check/1.0" },
      });
      const elapsed = performance.now() - started;
      timings.push(elapsed);
      if (!response.ok) failures.push({ pathname, status: response.status });
      await response.arrayBuffer();
    } catch (error) {
      failures.push({ pathname, status: 0, error: error.message });
    }
  }
}
await Promise.all(Array.from({ length: concurrency }, worker));
timings.sort((a, b) => a - b);
const percentile = (value) => timings[Math.min(timings.length - 1, Math.floor(timings.length * value))] || 0;
const result = {
  origin: origin.origin,
  requests,
  concurrency,
  successful: requests - failures.length,
  failures: failures.slice(0, 20),
  latencyMs: { p50: Math.round(percentile(0.5)), p95: Math.round(percentile(0.95)), max: Math.round(timings.at(-1) || 0) },
};
console.log(JSON.stringify(result, null, 2));
process.exit(failures.length ? 1 : 0);
