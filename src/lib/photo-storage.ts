import { put, get, del } from "@vercel/blob";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { HttpError } from "./auth";

const directory = () => path.join(process.env.DATA_DIR || "data", "uploads");
const hosted = () =>
  Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

export async function savePhoto(
  weddingId: string,
  photoId: string,
  bytes: Buffer,
): Promise<string> {
  if (hosted()) {
    const pathname = `weddings/${weddingId}/${photoId}.webp`;
    await put(pathname, bytes, {
      access: "private",
      addRandomSuffix: false,
      contentType: "image/webp",
    });
    return "blob:" + pathname;
  }
  if (process.env.VERCEL)
    throw new HttpError(
      503,
      "Photo storage is being connected. Please try again later.",
    );
  const filename = photoId + ".webp";
  await mkdir(directory(), { recursive: true });
  await writeFile(path.join(directory(), filename), bytes);
  return filename;
}

// Only call after the API has verified wedding/household access.
export async function readPhoto(
  filename: string,
): Promise<ReadableStream<Uint8Array> | Uint8Array<ArrayBuffer>> {
  if (filename.startsWith("blob:")) {
    const result = await get(filename.slice(5), {
      access: "private",
      useCache: false,
    });
    if (!result || result.statusCode !== 200)
      throw new HttpError(404, "Photo not found.");
    return result.stream;
  }
  return new Uint8Array(
    await readFile(path.join(directory(), path.basename(filename))),
  );
}

export async function deletePhoto(filename: string): Promise<void> {
  if (filename.startsWith("blob:")) {
    await del(filename.slice(5));
    return;
  }
  await unlink(path.join(directory(), path.basename(filename))).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    },
  );
}
