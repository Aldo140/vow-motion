"use client";
import { useEffect, useState } from "react";
import GuestExperience from "../guest-experience";
import {
  designSchema,
  withDesign,
  type WeddingDesign,
} from "@/lib/wedding-design";
import type { GuestData, Wedding } from "@/lib/types";
export default function DesignPreview({
  initial,
  design,
}: {
  initial: GuestData;
  design: WeddingDesign;
}) {
  const [draft, setDraft] = useState(design);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        event.data?.type !== "vow-design-preview"
      )
        return;
      const parsed = designSchema.safeParse(event.data.design);
      if (parsed.success) setDraft(parsed.data);
    };
    window.addEventListener("message", receive);
    window.parent.postMessage(
      { type: "vow-preview-ready" },
      window.location.origin,
    );
    return () => window.removeEventListener("message", receive);
  }, []);
  return (
    <GuestExperience
      key={draft.world + ":" + draft.opening}
      initial={{
        ...initial,
        wedding: withDesign(initial.wedding as Wedding, draft),
      }}
    />
  );
}
