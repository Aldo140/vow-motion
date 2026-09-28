"use client";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  placements,
  resolveWeddingMedia,
  type DesignAsset,
  type Placement,
  type WeddingDesign,
} from "@/lib/wedding-design";
import type { Wedding } from "@/lib/types";
import { preparePhoto } from "@/lib/prepare-photo";
import WeddingPhoto from "../wedding-photo";
import {
  photoFitNote,
  photoGuidance,
  photoSteps,
  priorityLabel,
  suggestedPhotoFit,
} from "@/lib/photo-guidance";

type Device = "phone" | "computer";
type Crop = { x: number; y: number; fit: "cover" | "contain" };
type Upload = {
  target: Placement;
  name: string;
  progress: number;
  status: string;
  error?: string;
};
const DEVICE_KEY = "vow-photo-device";
const ACCEPT = "image/jpeg,image/png,image/webp";

function guessDevice(): Device {
  if (typeof window === "undefined") return "computer";
  return window.matchMedia("(max-width: 720px), (pointer: coarse)").matches
    ? "phone"
    : "computer";
}

/** Where a click lands inside the visible photo, as a focus point in percent. */
function focusFromClick(
  event: MouseEvent<HTMLImageElement>,
  frame: Crop,
): Pick<Crop, "x" | "y"> {
  const image = event.currentTarget;
  const rect = image.getBoundingClientRect();
  const scale = (frame.fit === "contain" ? Math.min : Math.max)(
    rect.width / image.naturalWidth,
    rect.height / image.naturalHeight,
  );
  const width = image.naturalWidth * scale,
    height = image.naturalHeight * scale;
  const left = ((rect.width - width) * frame.x) / 100;
  const top = ((rect.height - height) * frame.y) / 100;
  const clamp = (value: number) =>
    Math.max(0, Math.min(100, Math.round(value * 100)));
  return {
    x: clamp((event.clientX - rect.left - left) / width),
    y: clamp((event.clientY - rect.top - top) / height),
  };
}

/**
 * A simplified drawing of the invitation on the chosen device, with the place
 * this photo fills highlighted and framed exactly as guests will see it.
 */
function SpotMock({
  wedding,
  placement,
  device,
  tag,
  onFocus,
}: {
  wedding: Omit<Wedding, "owner_id">;
  placement: Placement;
  device: Device;
  tag: string;
  onFocus?: (point: Pick<Crop, "x" | "y">) => void;
}) {
  const media = resolveWeddingMedia(wedding, placement);
  const frame: Crop = {
    x: 50,
    y: 50,
    fit: "cover",
    ...(device === "phone" ? media.phone : media.crop),
  };
  const spot = (shape: string) => (
    <div className={`spot-target ${shape}`}>
      <img
        src={media.src}
        alt=""
        draggable={false}
        style={{
          objectFit: frame.fit,
          objectPosition: `${frame.x}% ${frame.y}%`,
        }}
        onClick={
          onFocus ? (event) => onFocus(focusFromClick(event, frame)) : undefined
        }
        onError={(event) => {
          if (event.currentTarget.getAttribute("src") !== media.fallback)
            event.currentTarget.src = media.fallback;
        }}
      />
    </div>
  );
  const lines = (count: number, className = "") => (
    <div className={`mock-lines ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <i key={i} />
      ))}
    </div>
  );
  const screens: Record<Placement, React.ReactNode> = {
    opening: (
      <>
        {spot("spot-full")}
        <div className="mock-envelope" aria-hidden="true">
          <i />
        </div>
      </>
    ),
    invitation: (
      <>
        {lines(4, "mock-heading")}
        {spot("spot-hero")}
      </>
    ),
    story: (
      <>
        {spot("spot-print")}
        {lines(6)}
      </>
    ),
    details: (
      <>
        {lines(2, "mock-heading")}
        <div className="spot-tiles">
          {spot("spot-tile-wide")}
          {spot("spot-tile-square")}
          {spot("spot-tile-tall")}
        </div>
        {lines(3)}
      </>
    ),
    venue: (
      <>
        {spot("spot-postcard")}
        {lines(5)}
      </>
    ),
  };
  return (
    <figure
      className={`spot-mock mock-${device} mock-${placement}`}
      data-clickable={Boolean(onFocus) || undefined}
    >
      <div className="mock-device">
        <div className="mock-screen">{screens[placement]}</div>
      </div>
      <figcaption>
        <span className="spot-tag">{tag}</span>
        {onFocus &&
          (device === "phone"
            ? "Tap the photo to choose what stays in view."
            : "Click the photo to choose what stays in view.")}
      </figcaption>
    </figure>
  );
}

export function DesignPhotos({
  wedding,
  design,
  update,
  assets,
  setAssets,
  disabled,
  disabledNote,
  onUploading,
  selectedPlacement,
  onReview,
}: {
  wedding: Wedding;
  design: WeddingDesign;
  update: (next: WeddingDesign) => void;
  assets: DesignAsset[];
  setAssets: (assets: DesignAsset[]) => void;
  disabled: boolean;
  disabledNote?: React.ReactNode;
  onUploading: (busy: boolean) => void;
  selectedPlacement?: Placement;
  onReview: () => void;
}) {
  const [device, setDevice] = useState<Device | null>(null);
  const [suggested, setSuggested] = useState<Device>("computer");
  // -1 is the welcome screen; photoSteps.length is the summary.
  const [step, setStep] = useState(-1);
  const [upload, setUpload] = useState<Upload | null>(null);
  const [picking, setPicking] = useState(false);
  const [undo, setUndo] = useState<WeddingDesign["media"] | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const request = useRef<XMLHttpRequest | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const root = useRef<HTMLElement>(null);
  const assetRef = useRef(assets);
  assetRef.current = assets;
  const designRef = useRef(design);
  designRef.current = design;
  const endpoint = `/api/design/assets?wedding=${encodeURIComponent(wedding.id)}`;
  const assetSrc = (id: string) => endpoint.replace("?", `/${id}?`);

  useEffect(() => {
    setSuggested(guessDevice());
    try {
      const saved = localStorage.getItem(DEVICE_KEY);
      if (saved === "phone" || saved === "computer") setDevice(saved);
    } catch {}
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (request.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      request.current?.abort();
    };
  }, []);
  const go = (next: number) => {
    setStep(next);
    setPicking(false);
    setError("");
    setUndo(null);
    requestAnimationFrame(() => {
      root.current?.scrollIntoView({ block: "start", behavior: "auto" });
      heading.current?.focus({ preventScroll: true });
    });
  };
  // "Change photo" in the live preview jumps straight to that place's step.
  useEffect(() => {
    if (!selectedPlacement) return;
    setDevice((current) => current ?? guessDevice());
    setStep(photoSteps.indexOf(selectedPlacement));
    setPicking(false);
  }, [selectedPlacement]);
  const chooseDevice = (next: Device) => {
    setDevice(next);
    try {
      localStorage.setItem(DEVICE_KEY, next);
    } catch {}
  };

  const place = (asset: DesignAsset, target: Placement) => {
    const current = designRef.current;
    setUndo(current.media);
    update({
      ...current,
      media: {
        ...current.media,
        [target]: {
          asset: asset.id,
          crop: { x: 50, y: 50, fit: suggestedPhotoFit(asset, target) },
          worlds: {},
        },
      },
    });
    setPicking(false);
    setFeedback(
      `${photoGuidance[target].title}: your photo is in place. Guests still see the current design until you apply it.`,
    );
  };
  const restore = (target: Placement) => {
    setUndo(design.media);
    const media = { ...design.media };
    delete media[target];
    update({ ...design, media });
    setFeedback(`${photoGuidance[target].title}: original artwork restored.`);
  };
  const setFrame = (target: Placement, next: Crop) => {
    const current = design.media[target];
    if (!current) return;
    update({
      ...design,
      media: {
        ...design.media,
        [target]:
          device === "phone"
            ? {
                ...current,
                phoneWorlds: { ...current.phoneWorlds, [design.world]: next },
              }
            : {
                ...current,
                crop: next,
                worlds: { ...current.worlds, [design.world]: next },
              },
      },
    });
  };

  const send = async (file: File, target: Placement) => {
    setError("");
    setUpload({ target, name: file.name, progress: 0, status: "Preparing" });
    onUploading(true);
    try {
      if (/\.(heic|heif)$/i.test(file.name))
        throw new Error(
          "This is an iPhone HEIC photo. Export it as a JPEG, then choose it again.",
        );
      if (file.size > 40_000_000)
        throw new Error("Choose a photo under 40 MB.");
      const prepared = await preparePhoto(file);
      const form = new FormData();
      form.append("file", prepared);
      const asset = await new Promise<DesignAsset>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        request.current = xhr;
        xhr.open("POST", endpoint);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable)
            setUpload((row) =>
              row && {
                ...row,
                status: e.loaded === e.total ? "Finishing" : "Uploading",
                progress: Math.round((e.loaded / e.total) * 100),
              },
            );
        };
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) resolve(data);
            else reject(new Error(data.error));
          } catch {
            reject(new Error("The upload did not finish. Please try again."));
          }
        };
        xhr.onerror = () =>
          reject(new Error("Connection lost. Try again when you are online."));
        xhr.onabort = () => reject(new Error("Upload cancelled."));
        xhr.send(form);
      });
      const next = [asset, ...assetRef.current.filter((a) => a.id !== asset.id)];
      assetRef.current = next;
      setAssets(next);
      setUpload(null);
      place(asset, target);
    } catch (e) {
      setUpload(null);
      setError((e as Error).message);
    } finally {
      request.current = null;
      onUploading(false);
    }
  };

  const removeAsset = async (asset: DesignAsset) => {
    if (Object.values(design.media).some((p) => p?.asset === asset.id)) {
      setError(
        "This photo is still used in your invitation. Swap it out first, then delete it.",
      );
      return;
    }
    if (!confirm(`Delete ${asset.name} from this wedding's photos?`)) return;
    try {
      const response = await fetch(
        `/api/design/assets/${asset.id}?wedding=${encodeURIComponent(wedding.id)}`,
        { method: "DELETE" },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setAssets(assetRef.current.filter((item) => item.id !== asset.id));
      setFeedback("Photo deleted.");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const tagFor = (target: Placement) =>
    design.media[target]
      ? "Your photo"
      : target === "opening" && design.media.invitation
        ? "Using your main photo"
        : "Original artwork";
  const personalized = photoSteps.filter((p) => design.media[p]).length;

  const uploadButton = (target: Placement, label: string, primary: boolean) => (
    <label
      className={`button ${primary ? "primary" : "outline"} photo-guide-upload`}
      aria-disabled={disabled || Boolean(upload) || undefined}
    >
      {label}
      <input
        type="file"
        accept={ACCEPT}
        disabled={disabled || Boolean(upload)}
        aria-label={label}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void send(file, target);
          e.target.value = "";
        }}
      />
    </label>
  );

  const deviceSwitch = device && (
    <div className="photo-guide-device" role="group" aria-label="Preview on">
      {(["phone", "computer"] as Device[]).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={device === option}
          onClick={() => chooseDevice(option)}
        >
          {option === "phone" ? "Phone" : "Computer"}
        </button>
      ))}
    </div>
  );

  // Welcome: one question, and what to have ready.
  if (step < 0 || !device)
    return (
      <section ref={root} className="photo-guide photo-guide-welcome">
        <span className="eyebrow">YOUR PHOTOS</span>
        <h2 ref={heading} tabIndex={-1}>
          Add your photos in a few easy steps.
        </h2>
        <p>
          We&apos;ll show you exactly where each photo goes before you add it.
          Skip any step and that place keeps its original artwork.
        </p>
        <fieldset className="photo-guide-question">
          <legend>What are you using right now?</legend>
          {(["phone", "computer"] as Device[]).map((option) => (
            <button
              key={option}
              type="button"
              className="photo-guide-choice"
              aria-pressed={device === option}
              onClick={() => {
                chooseDevice(option);
                go(0);
              }}
            >
              <span className={`photo-guide-icon icon-${option}`} aria-hidden="true" />
              <strong>{option === "phone" ? "A phone" : "A computer"}</strong>
              <small>
                {option === "phone"
                  ? "Pick photos from your camera roll."
                  : "Choose files or drag them in."}
              </small>
              {suggested === option && <em>Looks like you&apos;re on one</em>}
            </button>
          ))}
        </fieldset>
        <div className="photo-guide-ready">
          <h3>Good to have ready</h3>
          <ol>
            {photoSteps.map((target) => (
              <li key={target}>
                <span>{photoGuidance[target].ready}</span>
                <small>{priorityLabel[photoGuidance[target].priority]}</small>
              </li>
            ))}
          </ol>
          <p>One photo of the two of you is enough to make it feel like yours.</p>
        </div>
        {disabled && disabledNote && (
          <p className="photo-guide-note">{disabledNote}</p>
        )}
      </section>
    );

  // Summary: every place at a glance, each one step away.
  if (step >= photoSteps.length)
    return (
      <section ref={root} className="photo-guide photo-guide-summary">
        <span className="eyebrow">ALL SET</span>
        <h2 ref={heading} tabIndex={-1}>
          {personalized
            ? `${personalized} of ${photoSteps.length} places have your photos.`
            : "Your invitation keeps its original artwork."}
        </h2>
        <p>
          The rest keep their original artwork. Preview the whole invitation
          next; nothing changes for guests until you apply it.
        </p>
        <ul className="photo-guide-overview">
          {photoSteps.map((target, index) => (
            <li key={target}>
              <WeddingPhoto
                wedding={wedding}
                placement={target}
                alt=""
                className="photo-guide-thumb"
              />
              <span>
                <strong>{photoGuidance[target].title}</strong>
                <small>{tagFor(target)}</small>
              </span>
              <button
                type="button"
                className="button outline small"
                onClick={() => go(index)}
              >
                {design.media[target] ? "Change" : "Add"}
              </button>
            </li>
          ))}
        </ul>
        <div className="photo-guide-actions">
          <button type="button" className="button primary" onClick={onReview}>
            Preview my invitation
          </button>
          <button
            type="button"
            className="button outline"
            onClick={() => go(0)}
          >
            Go through the steps again
          </button>
        </div>
        {!!assets.length && !disabled && (
          <details className="photo-guide-library">
            <summary>Manage uploaded photos ({assets.length})</summary>
            <ul>
              {assets.map((asset) => (
                <li key={asset.id}>
                  <img src={assetSrc(asset.id)} alt="" loading="lazy" />
                  <span>{asset.name}</span>
                  <button type="button" onClick={() => void removeAsset(asset)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
        {error && <p role="alert">{error}</p>}
        <p className="photo-guide-status" role="status" aria-live="polite">
          {feedback}
        </p>
      </section>
    );

  const target = photoSteps[step];
  const guide = photoGuidance[target];
  const current = design.media[target];
  const currentAsset = assets.find((asset) => asset.id === current?.asset);
  // Phones fall back to the shared framing until they are given their own.
  const desktopFrame = current?.worlds[design.world] ?? current?.crop;
  const frame: Crop = {
    x: 50,
    y: 50,
    fit: "cover",
    ...(device === "phone"
      ? (current?.phoneWorlds?.[design.world] ??
        current?.phone ??
        desktopFrame)
      : desktopFrame),
  };
  const note = currentAsset ? photoFitNote(currentAsset, target) : null;
  const uploadingHere = upload?.target === target;
  const nextTitle =
    step + 1 < photoSteps.length
      ? photoGuidance[photoSteps[step + 1]].title.toLowerCase()
      : null;

  return (
    <section ref={root} className={`photo-guide photo-guide-step device-${device}`}>
      <header className="photo-guide-top">
        <button type="button" className="photo-guide-back" onClick={() => go(step - 1)}>
          Back
        </button>
        <div
          className="photo-guide-progress"
          role="progressbar"
          aria-label="Photo steps"
          aria-valuemin={1}
          aria-valuemax={photoSteps.length}
          aria-valuenow={step + 1}
        >
          <span>
            Step {step + 1} of {photoSteps.length}
          </span>
          <ol aria-hidden="true">
            {photoSteps.map((p, i) => (
              <li key={p} data-state={i < step ? "done" : i === step ? "now" : undefined} />
            ))}
          </ol>
        </div>
        {deviceSwitch}
      </header>
      <div className="photo-guide-title">
        <span className={`photo-guide-priority priority-${guide.priority}`}>
          {priorityLabel[guide.priority]}
        </span>
        <h2 ref={heading} tabIndex={-1}>
          {guide.title}
        </h2>
      </div>
      <div className="photo-guide-body">
        <SpotMock
          wedding={wedding}
          placement={target}
          device={device}
          tag={tagFor(target)}
          onFocus={
            current && !disabled
              ? (point) => setFrame(target, { ...frame, ...point })
              : undefined
          }
        />
        <div className="photo-guide-copy">
          <p className="photo-guide-where">{guide.where}</p>
          <ul className="photo-guide-advice">
            <li className="advice-best">
              <b>Works best</b>
              {guide.best}
            </li>
            <li className="advice-avoid">
              <b>Avoid</b>
              {guide.avoid}
            </li>
          </ul>

          {uploadingHere ? (
            <div className="photo-guide-uploading" role="status">
              <span>
                {upload.status} {upload.name}
              </span>
              <progress max={100} value={upload.progress} />
              <button
                type="button"
                className="button outline small"
                onClick={() => request.current?.abort()}
              >
                Cancel
              </button>
            </div>
          ) : current ? (
            <div className="photo-guide-placed">
              {note && <p className="photo-guide-note">{note}</p>}
              {target !== "opening" && !disabled && (
                <label className="photo-guide-toggle">
                  <input
                    type="checkbox"
                    checked={frame.fit === "contain"}
                    onChange={(e) =>
                      setFrame(target, {
                        ...frame,
                        fit: e.target.checked ? "contain" : "cover",
                      })
                    }
                  />
                  Show the whole photo, with a paper border
                </label>
              )}
              {!disabled && (
                <div className="photo-guide-secondary">
                  {uploadButton(target, "Replace photo", false)}
                  <button
                    type="button"
                    className="button outline"
                    onClick={() => restore(target)}
                  >
                    {target === "opening" ? "Use my main photo instead" : "Use original instead"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="photo-guide-empty">
              <p className="photo-guide-skip">{guide.skip}</p>
              {disabled ? (
                disabledNote && <p className="photo-guide-note">{disabledNote}</p>
              ) : (
                <div className="photo-guide-secondary">
                  {uploadButton(
                    target,
                    device === "phone" ? "Choose from my photos" : "Upload a photo",
                    guide.priority === "essential",
                  )}
                  {!!assets.length && (
                    <button
                      type="button"
                      className="button outline"
                      aria-expanded={picking}
                      onClick={() => setPicking((open) => !open)}
                    >
                      Use one I already added
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {picking && !disabled && (
            <div className="photo-guide-picker" role="group" aria-label="Photos you already added">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  aria-label={`Use ${asset.name}`}
                  onClick={() => place(asset, target)}
                >
                  <img src={assetSrc(asset.id)} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
          {error && (
            <p className="photo-guide-error" role="alert">
              {error}
            </p>
          )}
          {undo && !disabled && (
            <button
              type="button"
              className="photo-guide-undo"
              onClick={() => {
                update({ ...design, media: undo });
                setUndo(null);
                setFeedback("Change undone.");
              }}
            >
              Undo
            </button>
          )}
          <p className="photo-guide-status" role="status" aria-live="polite">
            {feedback}
          </p>
        </div>
      </div>
      <footer className="photo-guide-nav">
        <button
          type="button"
          className="button primary"
          disabled={uploadingHere}
          onClick={() => go(step + 1)}
        >
          {current
            ? nextTitle
              ? `Next: ${nextTitle}`
              : "Finish"
            : nextTitle
              ? target === "opening"
                ? "Skip, use my main photo"
                : "Skip, keep the original"
              : "Skip and finish"}
        </button>
        <small>
          {placements[target].uses}. Guests see it on phones and computers; this
          preview shows {device === "phone" ? "a phone" : "a computer"}.
        </small>
      </footer>
    </section>
  );
}
