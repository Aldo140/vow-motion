"use client";
import { Composition } from "./runtime";
import AdScene, { AD_SCENES } from "./ad-scene";

/** The 35-second vertical brand ad (1080x1920), scaled to its container. */
export default function BrandAd({
  className,
  onTick,
}: {
  className?: string;
  onTick?: (T: number) => void;
}) {
  return (
    <Composition
      scenes={AD_SCENES as { name: string; dur: number }[]}
      width={1080}
      height={1920}
      bg="#100f0d"
      className={className}
      onTick={onTick}
    >
      <AdScene />
    </Composition>
  );
}
