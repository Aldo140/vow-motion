"use client";
import { Field, Modal, Notice, Submit } from "@/components/ui";
import { preparePhoto } from "@/lib/prepare-photo";
import type { GuestData } from "@/lib/types";
import { UploadSimpleIcon } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { copy } from "./copy";
export function UploadModal({
  data,
  locale,
  onClose,
  onSaved,
}: {
  data: GuestData;
  locale: "en" | "es";
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(false),
    c = copy[locale];
  const uploaded = useRef(new Set<string>());
  const [progress, setProgress] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const [chosen, setChosen] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const setFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    setChosen(list);
    // Keep the native input in sync so the existing form-submit path,
    // which reads FormData, works the same whether files came from a
    // tap-to-choose or a drag-and-drop.
    const transfer = new DataTransfer();
    for (const file of list) transfer.items.add(file);
    if (fileInput.current) fileInput.current.files = transfer.files;
  };
  return (
    <Modal title={c.share} onClose={onClose}>
      {message && <Notice error={error}>{message}</Notice>}
      {progress && <p role="status">{progress}</p>}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMessage("");
          const formElement = e.currentTarget;
          const form = new FormData(formElement);
          try {
            const files = form.getAll("file") as File[];
            for (const file of files) {
              if (/\.(heic|heif)$/i.test(file.name))
                throw new Error(
                  locale === "en"
                    ? `${file.name}: export this iPhone photo as a JPEG, then choose it again.`
                    : `${file.name}: exporta esta foto de iPhone como JPEG y elígela de nuevo.`,
                );
              if (
                !file.size ||
                file.size > 10 * 1024 * 1024 ||
                !["image/jpeg", "image/png", "image/webp"].includes(file.type)
              )
                throw new Error(
                  locale === "en"
                    ? `${file.name}: choose a JPG, PNG or WebP photo under 10 MB.`
                    : `${file.name}: elige una foto JPG, PNG o WebP de menos de 10 MB.`,
                );
            }
            for (const [index, file] of files.entries()) {
              const signature = `${file.name}-${file.size}-${file.lastModified}`;
              if (uploaded.current.has(signature)) continue;
              setProgress(
                locale === "en"
                  ? `Sharing photo ${index + 1} of ${files.length}…`
                  : `Compartiendo foto ${index + 1} de ${files.length}…`,
              );
              const body = new FormData();
              body.set("file", await preparePhoto(file));
              body.set("caption", String(form.get("caption") || ""));
              const response = await fetch(
                "/api/guest/photos?token=" + data.token,
                { method: "POST", body },
              );
              const result = await response.json();
              if (!response.ok) throw Error(result.error);
              uploaded.current.add(signature);
            }
            await onSaved();
            formElement.reset();
            setChosen([]);
            setError(false);
            setMessage(
              locale === "en"
                ? "Your memories are with your hosts, ready for review."
                : "Tus recuerdos están con los anfitriones, listos para revisar.",
            );
          } catch (e) {
            setError(true);
            setMessage((e as Error).message);
          } finally {
            setBusy(false);
            setProgress("");
          }
        }}
      >
        <label
          className={"guest-dropzone" + (dragOver ? " drag-over" : "")}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) setFiles(e.dataTransfer.files);
          }}
        >
          <UploadSimpleIcon size={22} aria-hidden="true" />
          <b>{locale === "en" ? "Choose your photos" : "Elige tus fotos"}</b>
          <p>
            {locale === "en"
              ? "Tap to choose from your phone, or drop them here."
              : "Toca para elegir desde tu teléfono, o suéltalas aquí."}
          </p>
          {chosen.length > 0 && (
            <span className="guest-dropzone-count">
              {locale === "en"
                ? `${chosen.length} ${chosen.length === 1 ? "photo" : "photos"} chosen`
                : `${chosen.length} ${chosen.length === 1 ? "foto elegida" : "fotos elegidas"}`}
            </span>
          )}
          <small>{c.uploadNote}</small>
          <input
            ref={fileInput}
            type="file"
            name="file"
            aria-label={
              locale === "en" ? "Choose your photos" : "Elige tus fotos"
            }
            accept="image/jpeg,image/png,image/webp"
            multiple
            required
            onChange={(e) => {
              if (e.target.files?.length) setChosen(Array.from(e.target.files));
            }}
          />
        </label>
        <Field
          label={
            locale === "en"
              ? "A little caption (optional)"
              : "Una descripción (opcional)"
          }
        >
          <textarea name="caption" maxLength={300} />
        </Field>
        <Submit pending={busy} disabled={!!data.preview}>
          {c.share}
          <UploadSimpleIcon size={17} />
        </Submit>
      </form>
    </Modal>
  );
}
