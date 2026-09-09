import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  deliver: vi.fn(),
  available: vi.fn(),
  query: vi.fn(),
  rateLimit: vi.fn(),
}));
vi.mock("@/lib/providers", () => ({
  deliver: mocks.deliver,
  emailAvailable: mocks.available,
}));
vi.mock("@/lib/auth", async () => {
  const actual = await import("../src/lib/auth");
  return { ...actual, sameOrigin: vi.fn(), rateLimit: mocks.rateLimit };
});
vi.mock("@/lib/db", () => ({
  db: async () => ({ query: mocks.query }),
  transaction: async (run: (db: { query: typeof mocks.query }) => unknown) =>
    run({ query: mocks.query }),
}));
vi.mock("@/lib/contact", () => import("../src/lib/contact"));
vi.mock("@/lib/request-body", () => ({
  readJson: (request: Request) => request.json(),
}));
import { POST } from "../src/app/api/contact/route";
const input = {
  requestId: "10000000-0000-4000-8000-000000000001",
  role: "planner",
  name: "Test Planner",
  email: "planner@example.test",
  business: "Test Studio",
  message: "I would like to see how this helps our couples.",
};
const request = (data: unknown) =>
  new Request("http://localhost/api/contact", {
    method: "POST",
    body: JSON.stringify(data),
  });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.available.mockReturnValue(true);
  mocks.query.mockResolvedValue({ rows: [{ id: input.requestId }] });
  mocks.deliver.mockResolvedValue({ status: "sent" });
});
it("delivers only to the configured contact, with the sender and planner details", async () => {
  expect((await POST(request(input))).status).toBe(200);
  expect(mocks.deliver).toHaveBeenCalledWith(
    expect.objectContaining({
      to: "jorti104@mtroyal.ca",
      body: expect.stringContaining("Reply to: planner@example.test"),
      demo: false,
    }),
  );
  expect(mocks.deliver.mock.calls[0][0].body).toContain(
    "Business: Test Studio",
  );
});
it("does not claim delivery when sending is unavailable or the provider fails", async () => {
  mocks.available.mockReturnValue(false);
  expect((await POST(request(input))).status).toBe(503);
  expect(mocks.deliver).not.toHaveBeenCalled();
  mocks.available.mockReturnValue(true);
  mocks.deliver.mockRejectedValue(new Error("offline"));
  expect((await POST(request(input))).status).toBe(500);
  expect(mocks.query).toHaveBeenCalledWith(
    expect.stringContaining("status='failed'"),
    [input.requestId],
  );
});
it("rejects missing roles and bot fields before delivery", async () => {
  expect((await POST(request({ ...input, role: "" }))).status).toBe(400);
  expect((await POST(request({ ...input, website: "spam" }))).status).toBe(400);
  expect(mocks.deliver).not.toHaveBeenCalled();
});
