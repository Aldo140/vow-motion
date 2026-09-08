"use client";
import { useRef, useState } from "react";

/** Studio panels mount after account data loads; drafts never cross account/wedding keys. */
export function useDraft<T extends object>(key: string, initial: T) {
  const storageKey = `vow-draft:v1:${key}`;
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved && typeof saved === "object" && !Array.isArray(saved))
        return { ...initial, ...saved };
    } catch {}
    return initial;
  });
  const current = useRef(value);
  const [status, setStatus] = useState(() => {
    try {
      if (localStorage.getItem(storageKey))
        return "Recovered an unfinished draft from this device. Review it before saving.";
    } catch {}
    return "Drafts stay in this browser until you save them to the wedding.";
  });
  function update(next: T | ((previous: T) => T)) {
    const resolved = typeof next === "function" ? next(current.current) : next;
    current.current = resolved;
    setValue(resolved);
    try {
      localStorage.setItem(storageKey, JSON.stringify(resolved));
      setStatus("Draft saved on this device. Safe to leave and return.");
    } catch {
      setStatus(
        "This browser could not store your draft. Keep this page open until you save.",
      );
    }
  }
  function clear() {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setStatus("Saved to your wedding.");
  }
  function discard() {
    clear();
    current.current = initial;
    setValue(initial);
    setStatus("Draft discarded. Showing the saved wedding details.");
  }
  return { value, update, clear, discard, status };
}
