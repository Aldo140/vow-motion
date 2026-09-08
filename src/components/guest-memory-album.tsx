"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CameraIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import type { GuestData } from "@/lib/types";
import { formatDate } from "@/lib/worlds";
import { Arrow, Modal } from "./ui";

export default function GuestMemoryAlbum({
  data,
  locale,
  onUpload,
}: {
  data: GuestData;
  locale: "en" | "es";
  onUpload: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const photo = selected === null ? null : data.photos[selected];
  const viewer = useRef<HTMLDivElement>(null);
  const viewing = Boolean(photo);
  useEffect(() => {
    if (!viewing) return;
    // Let the native dialog finish opening (including Strict Mode's remount)
    // before moving focus into the keyboard-operated photograph viewer.
    const frame = requestAnimationFrame(() =>
      viewer.current?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [viewing]);
  const move = (direction: number) =>
    setSelected((index) =>
      index === null
        ? null
        : (index + direction + data.photos.length) % data.photos.length,
    );
  const photoUrl = (id: string) => "/api/photos/" + id + "?token=" + data.token;
  const share = locale === "en" ? "Share a memory" : "Comparte un recuerdo";
  return (
    <section
      className="guest-memory memory-album"
      aria-labelledby="album-title"
    >
      <div className="album-heading">
        <span>{data.wedding.names}</span>
        <span>
          {formatDate(data.wedding.date, locale, {
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>
      <div className="album-spread">
        <div className="album-intro">
          <span className="album-inscription">
            {locale === "en"
              ? "Our day, through your eyes."
              : "Nuestro día, a través de tus ojos."}
          </span>
          <h2 id="album-title">
            {locale === "en"
              ? "The moments between."
              : "Los pequeños momentos."}
          </h2>
        </div>
        <div
          className={
            "album-gallery " +
            (data.photos.length ? "album-has-photos" : "album-awaiting-photos")
          }
        >
          {data.photos.length ? (
            <>
              <div className="album-prints">
                {data.photos.slice(0, 4).map((item, index) => (
                  <button
                    className="album-photo"
                    key={item.id}
                    onClick={() => setSelected(index)}
                    aria-label={
                      locale === "en"
                        ? `Open memory ${index + 1}${item.caption ? ": " + item.caption : ""}`
                        : `Ver recuerdo ${index + 1}${item.caption ? ": " + item.caption : ""}`
                    }
                  >
                    <img
                      src={photoUrl(item.id)}
                      alt={
                        item.caption ||
                        (locale === "en"
                          ? "A wedding memory"
                          : "Un recuerdo de la boda")
                      }
                      loading="lazy"
                    />
                    <span>
                      {item.caption ||
                        (locale === "en"
                          ? "A moment to keep"
                          : "Un momento para guardar")}
                    </span>
                    {!item.approved && (
                      <small>
                        {locale === "en"
                          ? "Awaiting host approval"
                          : "Pendiente de aprobación"}
                      </small>
                    )}
                  </button>
                ))}
              </div>
              <button className="album-browse" onClick={() => setSelected(0)}>
                {locale === "en"
                  ? `Browse ${data.photos.length} ${data.photos.length === 1 ? "memory" : "memories"}`
                  : `Ver ${data.photos.length} ${data.photos.length === 1 ? "recuerdo" : "recuerdos"}`}
                <Arrow size={18} />
              </button>
            </>
          ) : (
            <>
              <figure className="album-scene-print" aria-hidden="true">
                <img src="/images/wedding-evening.webp" alt="" loading="lazy" />
              </figure>
              <button
                className="album-first-slot"
                onClick={onUpload}
                aria-label={
                  locale === "en"
                    ? "Add the first memory"
                    : "Añade el primer recuerdo"
                }
              >
                <span className="album-photo-corners" aria-hidden="true" />
                <CameraIcon size={32} weight="thin" aria-hidden="true" />
                <span>
                  {locale === "en"
                    ? "This page is yours."
                    : "Esta página es tuya."}
                </span>
                <small>
                  {locale === "en"
                    ? "Add the first memory"
                    : "Añade el primer recuerdo"}
                  <Arrow diagonal size={17} />
                </small>
              </button>
            </>
          )}
        </div>
        <div className="album-letter">
          <p>
            {locale === "en"
              ? "The last dance. An unexpected embrace. The things only you saw. Leave a little of your day here, for us to keep."
              : "El último baile. Un abrazo inesperado. Eso que solo tú viste. Deja aquí un pedacito de tu día, para guardarlo siempre."}
          </p>
          <button className="album-upload" onClick={onUpload}>
            <span>{share}</span>
            <UploadSimpleIcon size={20} aria-hidden="true" />
          </button>
          <small>
            {locale === "en"
              ? "Your hosts review each photo before it joins the shared album."
              : "Los anfitriones revisan cada foto antes de añadirla al álbum compartido."}
          </small>
          <span className="album-page-number" aria-hidden="true">
            {locale === "en"
              ? "With love & a little nostalgia"
              : "Con amor y un poquito de nostalgia"}
          </span>
        </div>
      </div>
      {photo && selected !== null && (
        <Modal
          title={
            locale === "en" ? "A wedding memory" : "Un recuerdo de la boda"
          }
          onClose={() => setSelected(null)}
          wide
        >
          <div
            className="album-viewer"
            ref={viewer}
            tabIndex={-1}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                event.preventDefault();
                move(event.key === "ArrowRight" ? 1 : -1);
              }
            }}
          >
            <img
              src={photoUrl(photo.id)}
              alt={
                photo.caption ||
                (locale === "en"
                  ? "A wedding memory"
                  : "Un recuerdo de la boda")
              }
            />
            <div className="album-viewer-caption">
              <p>{photo.caption}</p>
              {!photo.approved && (
                <small>
                  {locale === "en"
                    ? "Only your household and hosts can see this photo until it is approved."
                    : "Hasta su aprobación, solo tu familia y los anfitriones pueden ver esta foto."}
                </small>
              )}
            </div>
            <div className="album-viewer-controls">
              <button
                onClick={() => move(-1)}
                disabled={data.photos.length < 2}
                aria-label={
                  locale === "en" ? "Previous memory" : "Recuerdo anterior"
                }
              >
                <ArrowLeftIcon size={20} />
              </button>
              <span aria-live="polite">
                {selected + 1} / {data.photos.length}
              </span>
              <button
                onClick={() => move(1)}
                disabled={data.photos.length < 2}
                aria-label={
                  locale === "en" ? "Next memory" : "Siguiente recuerdo"
                }
              >
                <ArrowRightIcon size={20} />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
