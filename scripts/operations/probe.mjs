const origin = new URL(process.env.RELEASE_URL || "http://localhost:3000");
const paths = ["/api/health", "/", "/planners", "/demo/riviera"];
const timeout = Number(process.env.PROBE_TIMEOUT_MS || 10000);
const results = [];

for (const pathname of paths) {
  const started = performance.now();
  try {
    const response = await fetch(new URL(pathname, origin), {
      redirect: "follow",
      signal: AbortSignal.timeout(timeout),
      headers: { "user-agent": "vow-motion-operations-probe/1.0" },
    });
    results.push({ pathname, status: response.status, milliseconds: Math.round(performance.now() - started) });
  } catch (error) {
    results.push({ pathname, status: 0, milliseconds: Math.round(performance.now() - started), error: error.message });
  }
}
const failed = results.filter((result) => result.status < 200 || result.status >= 400);
console.log(JSON.stringify({ origin: origin.origin, checkedAt: new Date().toISOString(), results }, null, 2));
process.exit(failed.length ? 1 : 0);
