import { HttpError } from "./security/http-error";
export async function readBytes(
  request: Request,
  limit: number,
): Promise<Buffer> {
  if (Number(request.headers.get("content-length") || 0) > limit)
    throw new HttpError(413, "This request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Please send valid details.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new HttpError(413, "This request is too large.");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export async function readJson(
  request: Request,
  limit: number,
): Promise<unknown> {
  const bytes = await readBytes(request, limit);
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new HttpError(400, "Please send valid details.");
  }
}

/** Bound the stream before the multipart parser allocates files in memory. */
export async function readFormData(request: Request, limit: number) {
  const bytes = await readBytes(request, limit);
  try {
    return await new Response(new Uint8Array(bytes), {
      headers: { "Content-Type": request.headers.get("content-type") || "" },
    }).formData();
  } catch {
    throw new HttpError(400, "Please send valid form details.");
  }
}
