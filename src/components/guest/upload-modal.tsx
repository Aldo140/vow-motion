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
        <Field
          label={locale === "en" ? "Choose your photos" : "Elige tus fotos"}
          hint={c.uploadNote}
        >
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            required
          />
        </Field>
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
