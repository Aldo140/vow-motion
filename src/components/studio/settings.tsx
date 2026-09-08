"use client";
import { PageHeading, type PanelProps } from "@/components/studio/shared";
import { Arrow, Field, Notice, Submit } from "@/components/ui";
import { ArrowUpRightIcon, CheckIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "react";

export function SettingsManager({ data, mutate, notify }: PanelProps) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [privacy, setPrivacy] = useState(data.wedding.privacy);
  return (
    <>
      <PageHeading
        title="The details behind the day."
        description="Your wedding essentials, privacy, and publishing controls."
      />
      {error && <Notice error>{error}</Notice>}
      <form
        className="settings-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const form = Object.fromEntries(new FormData(e.currentTarget));
          if (!form.password) delete form.password;
          try {
            await mutate(
              "settings",
              { ...data.wedding, ...form, privacy },
              "PATCH",
            );
            notify("Wedding settings saved.");
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <section>
          <div>
            <h2>Your wedding</h2>
            <p>The essentials that carry through your guest experience.</p>
          </div>
          <div>
            <Field label="Names">
              <input name="names" defaultValue={data.wedding.names} required />
            </Field>
            <div className="form-grid">
              <Field label="Date">
                <input
                  name="date"
                  type="date"
                  defaultValue={data.wedding.date}
                  required
                />
              </Field>
              <Field label="RSVP deadline">
                <input
                  name="rsvp_deadline"
                  type="date"
                  defaultValue={data.wedding.rsvp_deadline}
                  required
                />
              </Field>
            </div>
            <Field label="Location">
              <input
                name="location"
                defaultValue={data.wedding.location}
                required
              />
            </Field>
            <Field label="Timezone">
              <input
                name="timezone"
                defaultValue={data.wedding.timezone}
                required
              />
            </Field>
            <Field label="Default guest language">
              <select name="locale" defaultValue={data.wedding.locale}>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </Field>
          </div>
        </section>
        <section>
          <div>
            <h2>Privacy & publishing</h2>
            <p>
              Personal events always require a guest invitation, even when your
              story is public.
            </p>
          </div>
          <div>
            <Field label="Who can see your wedding story?">
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
              >
                <option value="invite-only">
                  Only guests with a personal link
                </option>
                <option value="public">
                  Public story, private guest details
                </option>
                <option value="password">Password-protected story</option>
              </select>
            </Field>
            {privacy === "password" && (
              <Field
                label="Wedding password"
                hint="At least 8 characters. Leave blank to keep an existing password."
              >
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                />
              </Field>
            )}
            <Field label="Experience mode">
              <select name="status" defaultValue={data.wedding.status}>
                <option value="draft">Draft</option>
                <option value="published">
                  Published · Before the wedding
                </option>
                <option value="memories">Memories · After the wedding</option>
              </select>
            </Field>
            <p className="muted-copy">
              Your story address:{" "}
              <a href={"/w/" + data.wedding.slug}>
                {"/w/" + data.wedding.slug} <ArrowUpRightIcon size={13} />
              </a>
            </p>
          </div>
        </section>
        <div className="form-actions">
          <Submit pending={busy}>
            Save settings
            <CheckIcon size={17} />
          </Submit>
        </div>
      </form>
      <section className="settings-extra">
        <div>
          <h2>A name of your own.</h2>
          <p className="muted-copy">
            Connect a custom domain when deployed. DNS verification and SSL are
            managed through your hosting provider.
          </p>
        </div>
        <div>
          {data.domains.map((d) => (
            <div className="report-line" key={d.id}>
              <b>{d.hostname}</b>
              <span className="status pending">
                {d.status === "pending" ? "Awaiting DNS setup" : d.status}
              </span>
            </div>
          ))}
          <form
            className="inline-form"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await mutate(
                  "domains",
                  Object.fromEntries(new FormData(e.currentTarget)),
                );
                notify(
                  "Domain saved. See deployment instructions for DNS setup.",
                );
              } catch (e) {
                notify((e as Error).message);
              }
            }}
          >
            <input
              name="hostname"
              aria-label="Custom domain"
              placeholder="elenaandmatteo.com"
              required
            />
            <button className="button outline">
              Add domain
              <PlusIcon size={16} />
            </button>
          </form>
        </div>
      </section>
      <section className="settings-extra">
        <div>
          <h2>Your collection</h2>
          <p className="muted-copy">
            {data.capabilities.billing
              ? "No card data is stored here. Checkout opens securely with Stripe."
              : "Your wedding tools are available without checkout in this release. No card is required and no charge will be made."}
          </p>
        </div>
        <div className="billing-buttons">
          {data.capabilities.billing &&
            ["essential", "signature", "bespoke"].map((plan) => (
              <button
                key={plan}
                className="button outline"
                onClick={async () => {
                  try {
                    const r = (await mutate("checkout", { plan })) as {
                      url: string;
                    };
                    window.location.href = r.url;
                  } catch (e) {
                    notify((e as Error).message);
                  }
                }}
              >
                {plan}
                <Arrow diagonal size={16} />
              </button>
            ))}
        </div>
      </section>
    </>
  );
}
