import { describe, expect, it } from "vitest";
import { readFormData, readJson } from "../src/lib/request-body";
describe("bounded JSON requests", () => {
  it("rejects multipart uploads whose actual body exceeds a false length header", async () => {
    const form = new FormData();
    form.set("file", new Blob(["x".repeat(1000)]), "photo.jpg");
    const request = new Request("https://example.test", {
      method: "POST",
      body: form,
      headers: { "content-length": "1" },
    });
    await expect(readFormData(request, 100)).rejects.toMatchObject({
      status: 413,
    });
  });
  it("preserves valid multipart files and rejects malformed forms", async () => {
    const form = new FormData();
    form.set("file", new Blob(["photo"]), "photo.jpg");
    const result = await readFormData(
      new Request("https://example.test", { method: "POST", body: form }),
      2000,
    );
    expect(await (result.get("file") as File).text()).toBe("photo");
    await expect(
      readFormData(
        new Request("https://example.test", {
          method: "POST",
          body: "invalid",
        }),
        100,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
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
