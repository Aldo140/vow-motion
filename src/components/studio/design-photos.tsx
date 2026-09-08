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
}: {
  wedding: Wedding;
  design: WeddingDesign;
  update: (next: WeddingDesign) => void;
  assets: DesignAsset[];
  setAssets: (assets: DesignAsset[]) => void;
  disabled: boolean;
  onUploading: (busy: boolean) => void;
  selectedPlacement?: Placement;
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
  const choose = (asset: string) => {
    setUndo(design.media);
    update({
      ...design,
      media: {
        ...design.media,
        [placement]: {
          asset,
          crop: { x: 50, y: 50, fit: "cover" },
          worlds: {},
        },
      },
    });
  };
  return (
    <section>
      <h2>Your photos. Beautifully at home.</h2>
      <p>
        One photo is enough. Keep the original artwork anywhere you like. Photos
        here belong to {wedding.names}.
      </p>
      {!disabled && assets.length > 1 && (
        <button
          className="button outline small"
          onClick={() => {
            setUndo(design.media);
            const media = { ...design.media };
            (["invitation", "story", "details"] as Placement[]).forEach(
              (role, index) => {
                if (!media[role] && assets[index])
                  media[role] = {
                    asset: assets[index].id,
                    crop: { x: 50, y: 50, fit: "cover" },
                    worlds: {},
                  };
              },
            );
            update({ ...design, media });
          }}
        >
          Try an arrangement in unused placements
        </button>
      )}
      <div className="design-photo-layout">
        <div className="design-placements">
          {(Object.keys(placements) as Placement[]).map((key) => (
            <button
              key={key}
              aria-pressed={placement === key}
              onClick={() => {
                setPlacement(key);
                setPhone(false);
              }}
            >
              <WeddingPhoto wedding={wedding} placement={key} alt="" />
              <span>
                <b>{placements[key].name}</b>
                <small>
                  {design.media[key] ? "Your photo" : "Original artwork"}
                </small>
              </span>
            </button>
          ))}
        </div>
        <div>
          <h3>{placements[placement].name}</h3>
          <p>
            {placements[placement].uses}. Other placements stay as they are.
          </p>
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
                }}
              >
                Undo photo change
              </button>
            )}
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
          <div className="design-library">
            {assets.map((asset) => (
              <article key={asset.id}>
                <img
                  src={`${endpoint.replace("?", `/${asset.id}?`)}`}
                  alt={asset.name}
                  loading="lazy"
                />
                <small>{asset.name}</small>
                <small>
                  {(Object.keys(placements) as Placement[])
                    .filter((role) => design.media[role]?.asset === asset.id)
                    .map((role) => placements[role].name)
                    .join(" · ") || "Available in your library"}
                </small>
                {Math.min(asset.width, asset.height) < 600 && (
                  <small>
                    This may look soft on a large screen. You can still use it.
                  </small>
                )}
                {!disabled && (
                  <>
                    <button onClick={() => choose(asset.id)}>
                      {current?.asset === asset.id
                        ? "Selected"
                        : `Use for ${placements[placement].name.toLowerCase()}`}
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          Object.values(design.media).some(
                            (photo) => photo?.asset === asset.id,
                          )
                        ) {
                          setError(
                            "This photo is in your draft. Use original artwork or choose another photo in those placements first.",
                          );
                          return;
                        }
                        if (
                          !confirm(
                            `Delete ${asset.name} from this wedding's library?`,
                          )
                        )
                          return;
                        setError("");
                        try {
                          const response = await fetch(
                            `/api/design/assets/${asset.id}?wedding=${encodeURIComponent(wedding.id)}`,
                            { method: "DELETE" },
                          );
                          const body = await response.json();
                          if (!response.ok) throw new Error(body.error);
                          setAssets(
                            assetRef.current.filter((a) => a.id !== asset.id),
                          );
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
