import { rows } from "./db";
import { HttpError } from "./auth";

/**
 * Instagram publishing through the Instagram API with Instagram Login
 * (graph.instagram.com) — a Business or Creator account, no Facebook Page.
 * Env holds the account id and the first long-lived token; once the worker has
 * refreshed it, the live token lives in the social_tokens table.
 */

const BASE = "https://graph.instagram.com/v21.0";
const REFRESH_URL = "https://graph.instagram.com/refresh_access_token";

export type MediaItem = { url: string; type: "image" | "video" };

export function instagramConfigured() {
  return Boolean(process.env.INSTAGRAM_ACCOUNT_ID);
}

/** The token the worker last refreshed, or the seed token from the environment. */
export async function activeInstagramToken(): Promise<string | null> {
  const [row] = await rows<{ access_token: string; expires_at: string }>(
    "SELECT access_token, expires_at FROM social_tokens WHERE id='instagram'",
  );
  if (row && new Date(row.expires_at).getTime() > Date.now())
    return row.access_token;
  return process.env.INSTAGRAM_ACCESS_TOKEN || null;
}

async function ig(
  path: string,
  params: Record<string, string>,
  method: "GET" | "POST" = "GET",
) {
  const token = await activeInstagramToken();
  if (!token) throw new HttpError(503, "Instagram is not connected.");
  const url = new URL(BASE + path);
  const body = new URLSearchParams({ ...params, access_token: token });
  const response = await fetch(
    method === "GET" ? `${url}?${body}` : url.toString(),
    {
      method,
      signal: AbortSignal.timeout(30_000),
      ...(method === "POST"
        ? {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body,
          }
        : {}),
    },
  );
  const text = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(text);
  } catch {
    /* non-JSON error body */
  }
  if (!response.ok) {
    const detail =
      (data.error as { message?: string })?.message || text.slice(0, 200);
    throw new HttpError(
      response.status === 429 ? 429 : 502,
      `Instagram: ${detail}`,
    );
  }
  return data;
}

/** Create one media container and, for video, wait until Instagram has processed it. */
async function container(params: Record<string, string>) {
  const { id } = (await ig(
    `/${process.env.INSTAGRAM_ACCOUNT_ID}/media`,
    params,
    "POST",
  )) as { id: string };
  if (!params.video_url && !params.media_type) return id;
  // Video and reels are processed asynchronously; poll for up to ~5 minutes.
  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise((r) => setTimeout(r, 10_000));
    const { status_code } = (await ig(`/${id}`, {
      fields: "status_code",
    })) as { status_code: string };
    if (status_code === "FINISHED") return id;
    if (status_code === "ERROR")
      throw new HttpError(502, "Instagram could not process this video.");
  }
  throw new HttpError(504, "Instagram is still processing this video.");
}

export async function publishToInstagram(input: {
  caption: string;
  media: MediaItem[];
  kind: "image" | "carousel" | "reel";
}): Promise<{ mediaId: string; permalink: string }> {
  if (!instagramConfigured())
    throw new HttpError(503, "Instagram is not connected.");
  if (!input.media.length) throw new HttpError(400, "Add at least one image.");

  let creationId: string;
  if (input.kind === "carousel") {
    if (input.media.length < 2 || input.media.length > 10)
      throw new HttpError(400, "A carousel needs between 2 and 10 items.");
    const children = await Promise.all(
      input.media.map((item) =>
        container(
          item.type === "video"
            ? { video_url: item.url, media_type: "VIDEO", is_carousel_item: "true" }
            : { image_url: item.url, is_carousel_item: "true" },
        ),
      ),
    );
    creationId = await container({
      media_type: "CAROUSEL",
      caption: input.caption,
      children: children.join(","),
    });
  } else if (input.kind === "reel") {
    creationId = await container({
      video_url: input.media[0].url,
      media_type: "REELS",
      caption: input.caption,
    });
  } else {
    creationId = await container({
      image_url: input.media[0].url,
      caption: input.caption,
    });
  }

  const { id: mediaId } = (await ig(
    `/${process.env.INSTAGRAM_ACCOUNT_ID}/media_publish`,
    { creation_id: creationId },
    "POST",
  )) as { id: string };

  let permalink = "";
  try {
    const meta = (await ig(`/${mediaId}`, { fields: "permalink" })) as {
      permalink?: string;
    };
    permalink = meta.permalink || "";
  } catch {
    /* the post is live; the permalink is a nicety */
  }
  return { mediaId, permalink };
}

/**
 * Exchange the current long-lived token for a fresh 60-day one. Instagram
 * requires the token to be at least 24h old and still valid, so the worker
 * calls this on a wide margin (about two weeks before expiry).
 */
export async function refreshInstagramToken(): Promise<{
  access_token: string;
  expires_at: Date;
} | null> {
  const token = await activeInstagramToken();
  if (!token) return null;
  const url = new URL(REFRESH_URL);
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", token);
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  return {
    access_token: data.access_token,
    expires_at: new Date(Date.now() + data.expires_in * 1000),
  };
}
