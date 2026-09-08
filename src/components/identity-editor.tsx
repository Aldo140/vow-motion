"use client";
import { type PanelProps } from "@/components/studio/shared";
import { identityStyle, weddingIdentity } from "@/lib/identity";
import { formatDate, getWorld } from "@/lib/worlds";
import { useState } from "react";
import GuestCrest from "./guest-crest";
import { Field, Notice, Submit } from "./ui";

export default function IdentityEditor({ data, mutate, notify }: PanelProps) {
  const [identity, setIdentity] = useState(() =>
    weddingIdentity(data.wedding.settings),
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const world = getWorld(data.wedding.world);
  const settings = { identity };
  return (
    <section className="pilot-panel identity-editor">
      <h2>The details that make it yours.</h2>
      <p>
        Refine your saved world. Your choices carry into the invitation, RSVP,
        itinerary and wedding pass.
      </p>
      {error && <Notice error>{error}</Notice>}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await mutate("identity", identity, "PATCH");
            notify("Identity details saved.");
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          <Field
            label="Couple monogram"
            hint="Leave blank to use initials from your names."
          >
            <input
              value={identity.monogram}
              maxLength={8}
              onChange={(e) =>
                setIdentity({ ...identity, monogram: e.target.value })
              }
            />
          </Field>
          <Field label="Typography">
            <select
              value={identity.typography}
              onChange={(e) =>
                setIdentity({
                  ...identity,
                  typography: e.target.value as typeof identity.typography,
                })
              }
            >
              <option value="world">World’s original typography</option>
              <option value="editorial">Editorial serif</option>
              <option value="classic">Classic serif</option>
              <option value="modern">Modern sans serif</option>
            </select>
          </Field>
          <Field label="Accent colour">
            <select
              value={identity.accent}
              onChange={(e) =>
                setIdentity({
                  ...identity,
                  accent: e.target.value as typeof identity.accent,
                })
              }
            >
              <option value="world">World’s original accent</option>
              <option value="olive">Olive</option>
              <option value="blue">Blue</option>
              <option value="wine">Wine</option>
            </select>
          </Field>
          <Field label={`Image focal point · ${identity.imagePosition}%`}>
            <input
              type="range"
              min={0}
              max={100}
              value={identity.imagePosition}
              onChange={(e) =>
                setIdentity({
                  ...identity,
                  imagePosition: Number(e.target.value),
                })
              }
            />
          </Field>
          <Field label="Planner attribution">
            <input
              value={identity.plannerName}
              maxLength={100}
              onChange={(e) =>
                setIdentity({ ...identity, plannerName: e.target.value })
              }
              placeholder="Your studio name"
            />
          </Field>
          <label className="identity-checkbox">
            <input
              type="checkbox"
              checked={identity.showPlanner}
              onChange={(e) =>
                setIdentity({ ...identity, showPlanner: e.target.checked })
              }
            />
            Show planner attribution to guests
          </label>
        </div>
        <Submit pending={busy} disabled={data.role === "viewer"}>
          Save identity details
        </Submit>
      </form>
      <div
        className={`identity-suite world-${world.id}`}
        style={identityStyle(settings, world.id === "notte")}
        aria-label="Coordinated identity preview"
      >
        <article className="identity-invitation">
          <img src={world.image} alt={`${world.name} invitation setting`} />
          <span>INVITATION</span>
          <GuestCrest
            names={data.wedding.names}
            world={world.id}
            monogram={identity.monogram}
            size={65}
          />
          <h3>{data.wedding.names}</h3>
          <p>{world.voice.en.invite}</p>
        </article>
        <article>
          <span>YOUR REPLY</span>
          <h3>{world.voice.en.arrival}</h3>
          <p>With pleasure · Sadly, I can’t</p>
          <div className="identity-rule" />
          <p>{world.voice.en.closing}</p>
        </article>
        <article>
          <span>THE ITINERARY</span>
          <h3>{formatDate(data.wedding.date)}</h3>
          {data.events.slice(0, 3).map((e) => (
            <p key={e.id}>
              {e.title} · {e.venue}
            </p>
          ))}
        </article>
        <article>
          <span>WEDDING PASS</span>
          <h3>{data.wedding.names}</h3>
          <p>{data.wedding.location}</p>
          <div className="identity-rule" />
          <p>{world.voice.en.closing}</p>
          {identity.showPlanner && identity.plannerName && (
            <small>Planned by {identity.plannerName}</small>
          )}
        </article>
      </div>
    </section>
  );
}
