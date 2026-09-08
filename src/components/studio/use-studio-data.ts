"use client";

import { useEffect, useState } from "react";
import type { StudioData } from "@/lib/types";
import { api } from "@/components/ui";

/** Wedding-scoped loading and mutations shared by every Studio panel. */
export function useStudioData(weddingId: string) {
  const [data, setData] = useState<StudioData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    api("/api/studio?wedding=" + weddingId)
      .then((next) => {
        if (mounted) {
          setData(next);
          setError("");
        }
      })
      .catch((cause) => {
        if (mounted) setError(cause.message);
      });
    return () => {
      mounted = false;
    };
  }, [weddingId]);

  const refresh = async () => {
    try {
      const next = await api("/api/studio?wedding=" + weddingId);
      setData(next);
      setError("");
    } catch (cause) {
      setError((cause as Error).message);
    }
  };

  const mutate = async (path: string, body?: unknown, method = "POST") => {
    const result = await api(
      "/api/studio/" + path + "?wedding=" + weddingId,
      method,
      body,
    );
    await refresh();
    return result;
  };

  return { data, error, refresh, mutate };
}
