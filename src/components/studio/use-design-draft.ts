"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  mergeDesign,
  designEqual,
  designSchema,
  type DesignState,
  type WeddingDesign,
} from "@/lib/wedding-design";

export function useDesignDraft(
  weddingId: string,
  email: string,
  readOnly: boolean,
) {
  const [state, setState] = useState<DesignState | null>(null);
  const [draft, setDraft] = useState<WeddingDesign | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<{
    state: DesignState;
    fields?: string[];
  } | null>(null);
  const [retry, setRetry] = useState(0);
  const [localWarning, setLocalWarning] = useState("");
  const busy = useRef(false);
  const latest = useRef(draft);
  latest.current = draft;
  const endpoint = `/api/design?wedding=${encodeURIComponent(weddingId)}`;
  const key = `vow-design:${email}:${weddingId}`;
  useEffect(() => {
    let active = true;
    fetch(endpoint)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (!active) return;
        setState(data);
        let next = data.draft;
        try {
          const stored = localStorage.getItem(key);
          if (stored && !readOnly) {
            const local = JSON.parse(stored);
            const result = mergeDesign(local.base, local.draft, data.draft);
            next = result.merged;
            if (result.conflicts.length)
              setConflict({ state: data, fields: result.conflicts });
          } else if (!readOnly) {
            const oldExperience = localStorage.getItem(
              `vow-draft:v1:${email}:${weddingId}:experience`,
            );
            const oldIdentity = localStorage.getItem(
              `vow-draft:v1:${email}:${weddingId}:identity`,
            );
            if (oldExperience || oldIdentity) {
              const migrated = designSchema.safeParse({
                ...data.draft,
                ...(oldExperience ? JSON.parse(oldExperience) : {}),
                identity: oldIdentity
                  ? JSON.parse(oldIdentity)
                  : data.draft.identity,
              });
              if (migrated.success) {
                next = migrated.data;
                setLocalWarning(
                  "Recovered your earlier draft from this device. Review it before applying the design.",
                );
                if (data.revision > 0 && !designEqual(next, data.draft))
                  setConflict({
                    state: data,
                    fields: ["Earlier draft on this device"],
                  });
              }
            }
          }
        } catch {
          setLocalWarning(
            "Local recovery is unavailable. Online saves still work.",
          );
        }
        setDraft(next);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [endpoint, key, readOnly, email, weddingId]);
  const save = useCallback(
    async (publish = false) => {
      if (!state || !latest.current || busy.current || readOnly || conflict)
        return false;
      busy.current = true;
      setSaving(true);
      setError("");
      const submitted = latest.current;
      try {
        const response = await fetch(
          publish
            ? `/api/design/publish?wedding=${encodeURIComponent(weddingId)}`
            : endpoint,
          {
            method: publish ? "POST" : "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              revision: state.revision,
              base: state.draft,
              draft: submitted,
            }),
          },
        );
        const result = await response.json();
        if (response.status === 409) {
          setConflict({
            state: { ...result.state, assets: state.assets },
            fields: result.fields,
          });
          return false;
        }
        if (!response.ok) throw new Error(result.error);
        setState((previous) => ({ ...previous!, ...result }));
        try {
          localStorage.removeItem(
            `vow-draft:v1:${email}:${weddingId}:experience`,
          );
          localStorage.removeItem(
            `vow-draft:v1:${email}:${weddingId}:identity`,
          );
        } catch {}
        setDraft((current) =>
          current
            ? mergeDesign(submitted, current, result.draft).merged
            : result.draft,
        );
        return true;
      } catch (e) {
        setError(
          (e as Error).message ||
            "Changes are on this device, not saved online. Retry saving.",
        );
        return false;
      } finally {
        busy.current = false;
        setSaving(false);
      }
    },
    [state, readOnly, conflict, endpoint, weddingId, email],
  );
  const dirty = Boolean(state && draft && !designEqual(state.draft, draft));
  useEffect(() => {
    if (!state || !draft || readOnly) return;
    try {
      if (dirty)
        localStorage.setItem(key, JSON.stringify({ base: state.draft, draft }));
      else localStorage.removeItem(key);
    } catch {
      setLocalWarning(
        "This browser cannot keep recovery copies. Keep this page open until your draft saves online.",
      );
    }
    if (!dirty || conflict || error) return;
    const timer = setTimeout(() => {
      void save();
    }, 900);
    return () => clearTimeout(timer);
  }, [draft, state, dirty, key, readOnly, conflict, error, retry, save]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  return {
    state,
    setState,
    draft,
    setDraft,
    saving,
    dirty,
    error,
    localWarning,
    conflict,
    retry: () => {
      setError("");
      setRetry((n) => n + 1);
    },
    publish: () => save(true),
    resolve: (keepMine: boolean) => {
      if (!conflict) return;
      setState(conflict.state);
      if (!keepMine) setDraft(conflict.state.draft);
      else if (state && latest.current)
        setDraft(
          mergeDesign(state.draft, latest.current, conflict.state.draft).merged,
        );
      setConflict(null);
      setError("");
    },
  };
}
