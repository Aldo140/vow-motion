"use client";
import { useEffect, useRef, useState } from "react";
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
import { photoGuidance, suggestedPhotoFit } from "@/lib/photo-guidance";

type Upload = {
  id: string;
  file: File;
  progress: number;
  status: string;
  error?: string;
};
function UploadThumbnail({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url ? (
    <img
      src={url}
      alt="Selected photo"
      width={48}
      height={48}
      style={{ objectFit: "cover" }}
      onError={(event) => {
        event.currentTarget.style.visibility = "hidden";
      }}
    />
  ) : null;
}
export function DesignPhotos({
  wedding,
  design,
  update,
  assets,
  setAssets,
  disabled,
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
  onUploading: (busy: boolean) => void;
  selectedPlacement?: Placement;
  onReview: () => void;
}) {
  const [placement, setPlacement] = useState<Placement>("invitation");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [error, setError] = useState("");
  const [undo, setUndo] = useState<WeddingDesign["media"] | null>(null);
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    if (selectedPlacement) setPlacement(selectedPlacement);
  }, [selectedPlacement]);
  const requests = useRef(new Map<string, XMLHttpRequest>());
  const active = useRef(new Set<string>());
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const pending = requests.current;
    const warn = (event: BeforeUnloadEvent) => {
      if (active.current.size) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      mounted.current = false;
      pending.forEach((request) => request.abort());
      window.removeEventListener("beforeunload", warn);
    };
  }, []);
  const assetRef = useRef(assets);
  assetRef.current = assets;
  const current = design.media[placement];
  const crop = (phone
    ? (current?.phoneWorlds?.[design.world] ?? current?.phone)
    : current?.worlds[design.world]) ??
    current?.crop ?? { x: 50, y: 50, fit: "cover" as const };
  const setCrop = (next: typeof crop) => {
    if (!current) return;
    update({
      ...design,
      media: {
        ...design.media,
        [placement]: phone
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
  const endpoint = `/api/design/assets?wedding=${encodeURIComponent(wedding.id)}`;
  const patchUpload = (id: string, patch: Partial<Upload>) =>
    setUploads((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  const upload = async (row: Upload) => {
    active.current.add(row.id);
    onUploading(true);
    patchUpload(row.id, { status: "Preparing", error: undefined, progress: 0 });
    try {
      if (/\.(heic|heif)$/i.test(row.file.name))
        throw new Error(
          "Export this iPhone photo as a JPEG, then choose it again.",
        );
      if (row.file.size > 40_000_000)
        throw new Error("Choose a photo under 40 MB.");
      const file = await preparePhoto(row.file);
      if (!active.current.has(row.id)) return;
      const form = new FormData();
      form.append("file", file);
      const asset = await new Promise<DesignAsset>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        requests.current.set(row.id, xhr);
        xhr.open("POST", endpoint);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable)
            patchUpload(row.id, {
              status: e.loaded === e.total ? "Processing" : "Uploading",
              progress: Math.round((e.loaded / e.total) * 100),
            });
        };
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) resolve(data);
            else reject(new Error(data.error));
          } catch {
            reject(new Error("Upload did not finish. Please retry."));
          }
        };
        xhr.onerror = () =>
          reject(new Error("Connection lost. Retry when you are back online."));
        xhr.onabort = () =>
          reject(
            new Error("Upload interrupted. Retry or choose another photo."),
          );
        xhr.send(form);
      });
      const next = [
        asset,
        ...assetRef.current.filter((a) => a.id !== asset.id),
      ];
      assetRef.current = next;
      setAssets(next);
      patchUpload(row.id, { status: "Ready", progress: 100 });
    } catch (e) {
      patchUpload(row.id, {
        status: "Needs attention",
        error: (e as Error).message,
      });
    } finally {
      requests.current.delete(row.id);
      active.current.delete(row.id);
      onUploading(active.current.size > 0);
    }
  };
  const add = async (files: FileList | File[]) => {
    const rows = Array.from(files)
      .slice(0, 50)
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: "Waiting",
      }));
    setUploads((previous) => [...previous, ...rows]);
    rows.forEach((row) => active.current.add(row.id));
    onUploading(true);
    // Sequential transport avoids exhausting mobile memory on large batches.
    for (const row of rows) {
      if (!mounted.current) break;
      if (active.current.has(row.id)) await upload(row);
    }
  };
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [draggedAsset, setDraggedAsset] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<Placement | null>(null);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState("");
  const destinations = useRef<HTMLDivElement>(null);
  const library = useRef<HTMLDivElement>(null);
  const checkPanel = useRef<HTMLDivElement>(null);
  const selected = assets.find((asset) => asset.id === selectedAsset);
  useEffect(() => {
    if (selectedPlacement) setChecking(true);
  }, [selectedPlacement]);
  const reveal = (ref: { current: HTMLElement | null }) =>
    requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ block: "start", behavior: "auto" });
      ref.current?.focus({ preventScroll: true });
    });
  const selectPhoto = (asset: DesignAsset) => {
    setSelectedAsset(asset.id);
    setChecking(false);
    setFeedback(`${asset.name} selected. Choose where it should appear below.`);
    reveal(destinations);
  };
  const choose = (assetId: string, target: Placement) => {
    if (disabled) return;
    const asset = assets.find((item) => item.id === assetId);
    if (!asset) {
      setFeedback("Choose a ready photo from your library first.");
      return;
    }
    const fit = suggestedPhotoFit(asset, target);
    setUndo(design.media);
    update({
      ...design,
      media: {
        ...design.media,
        [target]: { asset: assetId, crop: { x: 50, y: 50, fit }, worlds: {} },
      },
    });
    setPlacement(target);
    setPhone(false);
    setSelectedAsset(null);
    setDraggedAsset(null);
    setDropTarget(null);
    setChecking(true);
    setFeedback(
      `Placed in ${placements[target].name.toLowerCase()}. ${fit === "contain" ? "We kept the whole photo in a paper mount. " : "Check the framing below. "}This is a draft; guests still see the current design.`,
    );
    reveal(checkPanel);
  };
  const removeAsset = async (asset: DesignAsset) => {
    if (
      Object.values(design.media).some((photo) => photo?.asset === asset.id)
    ) {
      setError(
        "This photo is in your draft. Restore the original artwork in those places before deleting it.",
      );
      return;
    }
    if (!confirm(`Delete ${asset.name} from this wedding's photo library?`))
      return;
    try {
      const response = await fetch(
        `/api/design/assets/${asset.id}?wedding=${encodeURIComponent(wedding.id)}`,
        { method: "DELETE" },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setAssets(assetRef.current.filter((item) => item.id !== asset.id));
      if (selectedAsset === asset.id) setSelectedAsset(null);
      setFeedback("Photo removed from your library.");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const count = Object.values(design.media).filter(Boolean).length;
  return (
    <section className="photo-workspace">
      <header className="photo-workspace-heading">
        <span className="eyebrow">MAKE ROOM FOR YOUR MEMORIES</span>
        <h2>Your photos, in the right places.</h2>
        <p>
          Gather your favourites, then choose where they belong. One photo is
          enough. Every other place can keep its original artwork.
        </p>
      </header>
      <ol className="photo-journey" aria-label="How to personalize your photos">
        <li aria-current={!assets.length ? "step" : undefined}>
          <b>1</b>
          <span>
            Gather your photos<small>One library for this wedding</small>
          </span>
        </li>
        <li aria-current={assets.length && !checking ? "step" : undefined}>
          <b>2</b>
          <span>
            Choose their places<small>Drag a photo, or tap to choose</small>
          </span>
        </li>
        <li aria-current={checking ? "step" : undefined}>
          <b>3</b>
          <span>
            Check the invitation<small>Preview before guests see it</small>
          </span>
        </li>
      </ol>
      <div className="photo-arrangement-workbench">
        <div ref={library} tabIndex={-1} className="photo-library-panel">
          <div className="photo-panel-title">
            <span>01 / YOUR LIBRARY</span>
            <h3>Start with your favourites.</h3>
            <p>
              Photos for {wedding.names}. Upload them together; decide where
              each goes afterward.
            </p>
          </div>
          {!disabled && (
            <label
              className="design-dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void add(e.dataTransfer.files);
              }}
            >
              <b>Add your photos</b>
              <p>
                Choose files or drop them here. JPG, PNG or WebP. Large photos
                are prepared automatically; keep your original files on your
                device.
              </p>
              <small>
                Keep this page open until uploads say Ready. If you leave,
                completed photos stay saved; unfinished files need selecting
                again.
              </small>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  if (e.target.files) void add(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
          <div aria-live="polite">
            {uploads.map((row) => (
              <div className="design-upload-item" key={row.id}>
                <UploadThumbnail file={row.file} />
                <span>
                  {row.file.name}: {row.error || row.status}
                </span>
                {["Uploading", "Processing"].includes(row.status) && (
                  <progress max={100} value={row.progress} />
                )}
                {row.error && (
                  <>
                    <button onClick={() => void upload(row)}>Retry</button>
                    <label>
                      Choose another
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const replacement = { ...row, file };
                            patchUpload(row.id, { file });
                            void upload(replacement);
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </>
                )}
                {active.current.has(row.id) && (
                  <button
                    onClick={() => {
                      active.current.delete(row.id);
                      requests.current.get(row.id)?.abort();
                      patchUpload(row.id, { status: "Cancelled" });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
          {error && <p role="alert">{error}</p>}

          {!!assets.length && (
            <p className="photo-library-hint">
              {disabled
                ? "Your wedding’s saved photos."
                : "Drag a photo onto a place, or select it and choose a place."}
            </p>
          )}
          <div className="photo-library-grid">
            {assets.map((asset) => {
              const uses = (Object.keys(placements) as Placement[]).filter(
                (role) => design.media[role]?.asset === asset.id,
              );
              return (
                <article
                  key={asset.id}
                  data-selected={selectedAsset === asset.id}
                >
                  <button
                    type="button"
                    disabled={disabled}
                    className="photo-library-pick"
                    aria-pressed={selectedAsset === asset.id}
                    aria-label={`Choose ${asset.name}`}
                    draggable={!disabled}
                    onDragStart={(event) => {
                      event.dataTransfer.setData(
                        "application/x-vow-photo",
                        asset.id,
                      );
                      event.dataTransfer.effectAllowed = "copy";
                      setDraggedAsset(asset.id);
                      setSelectedAsset(asset.id);
                    }}
                    onDragEnd={() => {
                      setDraggedAsset(null);
                      setDropTarget(null);
                    }}
                    onClick={() => selectPhoto(asset)}
                  >
                    <img
                      src={`${endpoint.replace("?", `/${asset.id}?`)}`}
                      alt=""
                      loading="lazy"
                      draggable={false}
                    />
                    <span>
                      {selectedAsset === asset.id
                        ? "Selected · choose a place"
                        : "Choose this photo"}
                    </span>
                  </button>
                  <small className="photo-filename" title={asset.name}>
                    {asset.name}
                  </small>
                  <small className="photo-use-label">
                    {uses.map((role) => placements[role].name).join(" · ") ||
                      "Not placed yet"}
                  </small>
                  {Math.min(asset.width, asset.height) < 600 && (
                    <small className="photo-quality-note">
                      Small image: a larger copy will look sharper.
                    </small>
                  )}
                  {!disabled && (
                    <details className="photo-file-options">
                      <summary>Photo options</summary>
                      <button
                        type="button"
                        onClick={() => void removeAsset(asset)}
                      >
                        Delete from library
                      </button>
                    </details>
                  )}
                </article>
              );
            })}
          </div>
          {!assets.length && (
            <div className="photo-library-empty">
              <p>A photo of you together is a lovely place to start.</p>
              <small>
                No photos ready? Your invitation already has a complete set of
                artwork.
              </small>
            </div>
          )}
        </div>
        <div
          className="photo-destinations-panel"
          ref={destinations}
          tabIndex={-1}
        >
          <div className="photo-panel-title">
            <span>02 / WHERE THEY GO</span>
            <h3>A place for each kind of memory.</h3>
            <p>
              {count
                ? `${count} of 4 places personalized. The others keep their original artwork.`
                : "All four places already have artwork. Personalize any of them, or leave them as they are."}
            </p>
          </div>
          {selected && (
            <div className="photo-selection-bar" role="status">
              <img
                src={`${endpoint.replace("?", `/${selected.id}?`)}`}
                alt=""
              />
              <span>
                <b>Photo selected</b>Choose a place below.
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedAsset(null);
                  setFeedback(
                    "Selection cleared. Your invitation has not changed.",
                  );
                }}
              >
                Cancel
              </button>
            </div>
          )}
          <div className="photo-destination-grid">
            {(Object.keys(placements) as Placement[]).map((role, index) => {
              const chosen = assets.find(
                (asset) => asset.id === design.media[role]?.asset,
              );
              const candidate = assets.find(
                (asset) => asset.id === (draggedAsset ?? selectedAsset),
              );
              return (
                <article
                  key={role}
                  className={`photo-destination ${dropTarget === role ? "drop-ready" : ""}`}
                  data-placement={role}
                  onDragOver={(event) => {
                    if (disabled) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "copy";
                    setDropTarget(role);
                  }}
                  onDragLeave={(event) => {
                    if (
                      !event.currentTarget.contains(
                        event.relatedTarget as Node | null,
                      )
                    )
                      setDropTarget(null);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDropTarget(null);
                    if (disabled) return;
                    const photo = event.dataTransfer.getData(
                      "application/x-vow-photo",
                    );
                    if (photo) choose(photo, role);
                    else {
                      setFeedback(
                        "Add files to your library first, then choose where they go.",
                      );
                      reveal(library);
                    }
                  }}
                >
                  <div
                    className={`photo-destination-preview photo-place-${role}`}
                  >
                    <WeddingPhoto
                      wedding={wedding}
                      placement={role}
                      alt={`${placements[role].name} preview`}
                    />
                    <span>{chosen ? "Your photo" : "Original artwork"}</span>
                  </div>
                  <div className="photo-destination-copy">
                    <small>{String(index + 1).padStart(2, "0")}</small>
                    <h4>{placements[role].name}</h4>
                    <p>{photoGuidance[role].idea}</p>
                    <small>{photoGuidance[role].shape}</small>
                    <p className="photo-appears">
                      <b>Appears in</b>
                      {photoGuidance[role].where}
                    </p>
                    {candidate && (
                      <p className="photo-fit-hint">
                        {suggestedPhotoFit(candidate, role) === "contain"
                          ? "We’ll show the whole photo in a paper mount."
                          : "We’ll fit it to the frame. You can adjust it next."}
                      </p>
                    )}
                    <button
                      type="button"
                      className="button outline small"
                      disabled={disabled}
                      onClick={() => {
                        if (selectedAsset) choose(selectedAsset, role);
                        else {
                          setPlacement(role);
                          setPhone(false);
                          setChecking(true);
                          setFeedback(
                            `Checking ${placements[role].name.toLowerCase()}. Choose a library photo to replace it, or keep this artwork.`,
                          );
                          reveal(checkPanel);
                        }
                      }}
                    >
                      {selectedAsset
                        ? `Place photo in ${placements[role].name.toLowerCase()}`
                        : `Check ${placements[role].name.toLowerCase()}`}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
      <div
        className="photo-workspace-feedback"
        role="status"
        aria-live="polite"
      >
        {feedback ||
          "Your photos stay in your draft until you review and apply the design."}
      </div>
      <div
        ref={checkPanel}
        tabIndex={-1}
        className="photo-check-panel"
        hidden={!checking}
      >
        <div className="photo-panel-title">
          <span>03 / CHECK YOUR PHOTO</span>
          <h3>{placements[placement].name}</h3>
          <p>
            {placements[placement].uses}.{" "}
            {current
              ? "Here is how your photo is framed. Adjust only if you need to."
              : "This is the original artwork. You can keep it or choose a photo from your library."}
          </p>
        </div>
        <div className="design-framing">
          <div className="design-frame-previews">
            {["Phone", "Desktop"].map((label, index) => {
              const resolved = resolveWeddingMedia(wedding, placement);
              const frame = index === 0 ? resolved.phone : resolved.crop;
              return (
                <figure key={label}>
                  <img
                    src={resolved.src}
                    alt={`${label} framing preview`}
                    style={{
                      objectFit: frame?.fit ?? "cover",
                      objectPosition: `${frame?.x ?? 50}% ${frame?.y ?? 50}%`,
                    }}
                    onClick={(e) => {
                      if (disabled || !current) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const image = e.currentTarget;
                      const fit = frame?.fit ?? "cover";
                      const scale = (fit === "contain" ? Math.min : Math.max)(
                        rect.width / image.naturalWidth,
                        rect.height / image.naturalHeight,
                      );
                      const width = image.naturalWidth * scale,
                        height = image.naturalHeight * scale;
                      const left =
                        ((rect.width - width) * (frame?.x ?? 50)) / 100;
                      const top =
                        ((rect.height - height) * (frame?.y ?? 50)) / 100;
                      const next = {
                        ...(frame ?? crop),
                        x: Math.max(
                          0,
                          Math.min(
                            100,
                            Math.round(
                              ((e.clientX - rect.left - left) / width) * 100,
                            ),
                          ),
                        ),
                        y: Math.max(
                          0,
                          Math.min(
                            100,
                            Math.round(
                              ((e.clientY - rect.top - top) / height) * 100,
                            ),
                          ),
                        ),
                      };
                      update({
                        ...design,
                        media: {
                          ...design.media,
                          [placement]:
                            index === 0
                              ? {
                                  ...current,
                                  phoneWorlds: {
                                    ...current.phoneWorlds,
                                    [design.world]: next,
                                  },
                                }
                              : {
                                  ...current,
                                  crop: next,
                                  worlds: {
                                    ...current.worlds,
                                    [design.world]: next,
                                  },
                                },
                        },
                      });
                    }}
                  />
                  <figcaption>{label}</figcaption>
                </figure>
              );
            })}
          </div>
          {current && !disabled && (
            <details>
              <summary>Adjust framing</summary>
              <p>
                Keep this part in frame. Tap a preview or use the controls
                below.
              </p>
              <label>
                Adjust
                <select
                  value={phone ? "phone" : "desktop"}
                  onChange={(e) => setPhone(e.target.value === "phone")}
                >
                  <option value="desktop">Desktop and default framing</option>
                  <option value="phone">Phone framing</option>
                </select>
              </label>
              <label>
                Left to right
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={crop.x}
                  onChange={(e) =>
                    setCrop({ ...crop, x: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Top to bottom
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={crop.y}
                  onChange={(e) =>
                    setCrop({ ...crop, y: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Photo fit
                <select
                  value={crop.fit}
                  onChange={(e) =>
                    setCrop({
                      ...crop,
                      fit: e.target.value as "cover" | "contain",
                    })
                  }
                >
                  <option value="cover">Fill the frame</option>
                  <option value="contain">Show whole photo</option>
                </select>
              </label>
              <button
                className="button outline small"
                onClick={() => setCrop({ x: 50, y: 50, fit: "cover" })}
              >
                Reset framing
              </button>
            </details>
          )}
          {current && !disabled && (
            <button
              className="button outline small"
              onClick={() => {
                setUndo(design.media);
                const media = { ...design.media };
                delete media[placement];
                update({ ...design, media });
                setFeedback(
                  `Original artwork restored in ${placements[placement].name.toLowerCase()}. You can undo this change.`,
                );
              }}
            >
              Use original artwork
            </button>
          )}
          {undo && !disabled && (
            <button
              className="button outline small"
              onClick={() => {
                update({ ...design, media: undo });
                setUndo(null);
                setFeedback(
                  "Photo change undone. Check the restored preview below.",
                );
              }}
            >
              Undo photo change
            </button>
          )}
        </div>

        <div className="photo-check-actions">
          <button
            type="button"
            className="button outline"
            onClick={() => {
              setSelectedAsset(null);
              reveal(library);
            }}
          >
            Choose another photo
          </button>
          <button
            type="button"
            className="button primary"
            onClick={() => {
              setChecking(false);
              setFeedback(
                `${placements[placement].name} checked. You can personalize another place or preview your invitation.`,
              );
              reveal(destinations);
            }}
          >
            Looks good
          </button>
        </div>
      </div>
      <div className="photo-finish">
        <div>
          <h3>Ready to see it all together?</h3>
          <p>
            Preview your full invitation. You’ll choose when to apply the
            changes.
          </p>
        </div>
        <button type="button" className="button primary" onClick={onReview}>
          Preview my invitation
        </button>
      </div>
    </section>
  );
}
