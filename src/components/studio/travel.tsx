"use client";
import { PageHeading, type PanelProps } from "@/components/studio/shared";
import { Arrow, Field, Modal, Notice, Submit } from "@/components/ui";
import type { Travel } from "@/lib/types";
import { getWorld } from "@/lib/worlds";
import { PencilSimpleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";

export function TravelManager({ data, mutate, notify }: PanelProps) {
  const [adding, setAdding] = useState<"travel" | "registry" | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState<
      (Partial<Travel> & { id: string; title: string; url: string }) | null
    >(null);
  return (
    <>
      <PageHeading
        title="The journey is part of it."
        description="Help your guests arrive, settle in, and feel at home."
      >
        <button
          className="button outline"
          onClick={() => {
            setEditing(null);
            setError("");
            setAdding("registry");
          }}
        >
          Add registry link
          <PlusIcon size={16} />
        </button>
        <button
          className="button primary"
          onClick={() => {
            setEditing(null);
            setError("");
            setAdding("travel");
          }}
        >
          Add travel detail
          <PlusIcon size={16} />
        </button>
      </PageHeading>
      <div className="travel-studio">
        <img
          src={getWorld(data.wedding.world).image}
          alt="Your wedding destination"
        />
        <div>
          {data.travel.map((t) => (
            <article className="travel-item" key={t.id}>
              <span className="eyebrow">{t.type}</span>
              <h2>{t.title}</h2>
              <p>{t.description}</p>
              {t.price && <small>{t.price}</small>}
              <div>
                <a
                  href={
                    t.url ||
                    "https://www.google.com/maps/search/?api=1&query=" +
                      encodeURIComponent(t.address)
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="text-link"
                >
                  {t.url ? "Visit website" : "View directions"}
                  <Arrow diagonal size={15} />
                </a>
                <button
                  className="button outline small"
                  onClick={() => {
                    setEditing(t);
                    setError("");
                    setAdding("travel");
                  }}
                  aria-label={"Edit " + t.title}
                >
                  <PencilSimpleIcon size={16} />
                  Edit
                </button>
                <button
                  className="icon-button"
                  aria-label={"Remove " + t.title}
                  onClick={async () => {
                    await mutate("travel/" + t.id, undefined, "DELETE");
                    notify("Travel detail removed.");
                  }}
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            </article>
          ))}
          {!data.travel.length && (
            <div className="empty-state">
              <h2>Help them find their way.</h2>
              <p>Add hotels, transport, and a few local favourites.</p>
            </div>
          )}
        </div>
      </div>
      <section className="registry-editor">
        <h2>A note on gifts.</h2>
        <p className="muted-copy">
          Link to a registry you already love. Your guests book or purchase
          directly with the provider.
        </p>
        {data.registry.map((r) => (
          <div className="report-line" key={r.id}>
            <a href={r.url} target="_blank" rel="noreferrer">
              {r.title}
              <Arrow diagonal />
            </a>
            <button
              className="button outline small"
              onClick={() => {
                setEditing(r);
                setError("");
                setAdding("registry");
              }}
              aria-label={"Edit " + r.title}
            >
              <PencilSimpleIcon size={16} />
              Edit
            </button>
            <button
              className="icon-button"
              aria-label={"Remove " + r.title}
              onClick={() => mutate("registry/" + r.id, undefined, "DELETE")}
            >
              <TrashIcon size={16} />
            </button>
          </div>
        ))}
      </section>
      {adding && (
        <Modal
          title={
            adding === "travel" ? "A thoughtful travel detail" : "Your registry"
          }
          onClose={() => setAdding(null)}
        >
          {error && <Notice error>{error}</Notice>}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                await mutate(
                  adding + (editing ? "/" + editing.id : ""),
                  Object.fromEntries(new FormData(e.currentTarget)),
                  editing ? "PATCH" : "POST",
                );
                setAdding(null);
                notify("Guest information saved.");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field label="Title">
              <input name="title" defaultValue={editing?.title} required />
            </Field>
            {adding === "travel" && (
              <>
                <Field label="Type">
                  <select name="type" defaultValue={editing?.type || "hotel"}>
                    <option value="hotel">Accommodation</option>
                    <option value="transport">Transportation</option>
                    <option value="guide">Local guide</option>
                  </select>
                </Field>
                <Field label="Description">
                  <textarea
                    name="description"
                    defaultValue={editing?.description}
                    required
                    rows={4}
                  />
                </Field>
                <Field label="Address">
                  <input name="address" defaultValue={editing?.address} />
                </Field>
                <Field label="Price note (optional)">
                  <input name="price" defaultValue={editing?.price} />
                </Field>
              </>
            )}
            <Field label="Website link">
              <input
                name="url"
                defaultValue={editing?.url}
                type="url"
                placeholder="https://"
                required={adding === "registry"}
              />
            </Field>
            <Submit pending={busy}>
              Save detail
              <Arrow />
            </Submit>
          </form>
        </Modal>
      )}
    </>
  );
}
