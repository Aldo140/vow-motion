"use client";
import {
  createContext,
  useContext,
  type CSSProperties,
  type ImgHTMLAttributes,
  type ReactNode,
} from "react";
import type { Wedding } from "@/lib/types";
import { resolveWeddingMedia, type Placement } from "@/lib/wedding-design";
const MediaContext = createContext<{
  wedding: Omit<Wedding, "owner_id">;
  token?: string;
} | null>(null);
export function WeddingMediaProvider({
  wedding,
  token,
  children,
}: {
  wedding: Omit<Wedding, "owner_id">;
  token?: string;
  children: ReactNode;
}) {
  return (
    <MediaContext.Provider value={{ wedding, token }}>
      {children}
    </MediaContext.Provider>
  );
}
export default function WeddingPhoto({
  placement,
  wedding: explicit,
  token,
  editControl = false,
  ...props
}: Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  placement: Placement;
  wedding?: Omit<Wedding, "owner_id">;
  token?: string;
  editControl?: boolean;
}) {
  const context = useContext(MediaContext);
  const wedding = explicit ?? context?.wedding;
  if (!wedding) throw new Error("WeddingPhoto requires a wedding.");
  const media = resolveWeddingMedia(
    wedding,
    placement,
    token ?? context?.token,
  );
  const style = media.crop
    ? ({
        "--photo-position": `${media.crop.x}% ${media.crop.y}%`,
        "--photo-fit": media.crop.fit,
        "--photo-phone-position": `${media.phone?.x}% ${media.phone?.y}%`,
        "--photo-phone-fit": media.phone?.fit,
      } as CSSProperties)
    : {};
  const editable = context?.token === "design-preview" && editControl;
  return (
    <>
      <img
        {...props}
        alt={props.alt ?? ""}
        src={media.src}
        data-personal-photo={media.personal || undefined}
        className={[
          props.className,
          media.personal ? "wedding-personal-photo" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ ...props.style, ...style }}
        onError={(event) => {
          if (event.currentTarget.getAttribute("src") !== media.fallback)
            event.currentTarget.src = media.fallback;
        }}
      />
      {editable && (
        <button
          type="button"
          className="wedding-photo-edit"
          onClick={() =>
            window.parent.postMessage(
              { type: "vow-select-photo", placement },
              window.location.origin,
            )
          }
        >
          Change photo
        </button>
      )}
    </>
  );
}
