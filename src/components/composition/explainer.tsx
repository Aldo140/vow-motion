"use client";
import { forwardRef } from "react";
import { Composition, type CompositionHandle } from "./runtime";
import ExplainerScene, { EXPLAINER_SCENES } from "./explainer-scene";

/** The 40-second brand explainer, scaled to its container. */
const BrandExplainer = forwardRef<
  CompositionHandle,
  {
    className?: string;
    onTick?: (T: number) => void;
    fit?: "contain" | "cover";
  }
>(function BrandExplainer({ className, onTick, fit }, ref) {
  return (
    <Composition
      ref={ref}
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
});
export default BrandExplainer;
