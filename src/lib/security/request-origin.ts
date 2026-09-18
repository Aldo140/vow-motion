import { HttpError } from "./http-error";

function originOf(value: string): string | null {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

/** Protect browser mutations; originless non-browser clients remain supported. */
export function sameOrigin(request: Request) {
  const supplied = request.headers.get("origin");
  if (supplied !== null) {
    const origin = originOf(supplied);
    const allowed = [originOf(request.url)];
    if (process.env.APP_URL) allowed.push(originOf(process.env.APP_URL));
    if (origin && allowed.includes(origin)) return;
  } else if (request.headers.get("sec-fetch-site") !== "cross-site") {
    return;
  }
  throw new HttpError(403, "This request could not be verified.");
}
