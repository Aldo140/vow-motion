"use client";
import { Composition } from "./runtime";
import ExplainerScene, { EXPLAINER_SCENES } from "./explainer-scene";

/** The 40-second brand explainer, scaled to its container. */
export default function BrandExplainer({ className }: { className?: string }) {
  return (
    <Composition
      scenes={EXPLAINER_SCENES}
      width={1920}
      height={1080}
      bg="#f3f0e9"
      className={className}
    >
      <ExplainerScene />
    </Composition>
  );
}
