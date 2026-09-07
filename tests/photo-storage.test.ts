import { beforeEach, describe, expect, it, vi } from "vitest";
const blob = vi.hoisted(() => ({ put: vi.fn(), get: vi.fn(), del: vi.fn() }));
vi.mock("@vercel/blob", () => blob);
import { savePhoto, readPhoto, deletePhoto } from "../src/lib/photo-storage";
beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});
describe("private hosted photo storage", () => {
  it("stores private objects and streams them through the authorized API", async () => {
    vi.stubEnv("BLOB_STORE_ID", "store_test");
    const filename = await savePhoto(
      "wedding-1",
      "photo-1",
      Buffer.from("image"),
    );
    expect(filename).toBe("blob:weddings/wedding-1/photo-1.webp");
    expect(blob.put).toHaveBeenCalledWith(
      "weddings/wedding-1/photo-1.webp",
      expect.any(Buffer),
      expect.objectContaining({ access: "private", addRandomSuffix: false }),
    );
    const stream = new ReadableStream();
    blob.get.mockResolvedValue({ statusCode: 200, stream });
    expect(await readPhoto(filename)).toBe(stream);
    expect(blob.get).toHaveBeenCalledWith("weddings/wedding-1/photo-1.webp", {
      access: "private",
      useCache: false,
    });
    await deletePhoto(filename);
    expect(blob.del).toHaveBeenCalledWith("weddings/wedding-1/photo-1.webp");
  });
  it("does not silently write photos to ephemeral serverless disk", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("BLOB_STORE_ID", "");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    await expect(
      savePhoto("w", "p", Buffer.from("image")),
    ).rejects.toMatchObject({ status: 503 });
  });
});
