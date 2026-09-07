import { describe, expect, it } from "vitest";
import { readJson } from "../src/lib/request-body";
describe("bounded JSON requests", () => {
  it("rejects an oversized body without relying on content-length", async () => {
    const request = new Request("https://example.test", {
      method: "POST",
      body: JSON.stringify({ payload: "a".repeat(100) }),
    });
    await expect(readJson(request, 32)).rejects.toMatchObject({ status: 413 });
  });
  it("accepts valid input and gives a safe error for malformed JSON", async () => {
    await expect(
      readJson(
        new Request("https://example.test", {
          method: "POST",
          body: '{"name":"Elena"}',
        }),
        100,
      ),
    ).resolves.toEqual({ name: "Elena" });
    await expect(
      readJson(
        new Request("https://example.test", {
          method: "POST",
          body: "invalid",
        }),
        100,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
});
