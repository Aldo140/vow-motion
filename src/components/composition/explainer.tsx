"use client";
import { Composition } from "./runtime";
import ExplainerScene, { EXPLAINER_SCENES } from "./explainer-scene";

/** The 40-second brand explainer, scaled to its container. */
export default function BrandExplainer({
  className,
  onTick,
  fit,
}: {
  className?: string;
  onTick?: (T: number) => void;
  fit?: "contain" | "cover";
}) {
  return (
    <Composition
      scenes={EXPLAINER_SCENES}
      width={1920}
      height={1080}
      bg="#f3f0e9"
      className={className}
      onTick={onTick}
      fit={fit}
    >
      <ExplainerScene />
    </Composition>
  );
}
