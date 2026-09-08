"use client";
import { PageHeading, type PanelProps } from "@/components/studio/shared";
import { Arrow, Field, Notice, Submit } from "@/components/ui";
import { ArrowUpRightIcon, CheckIcon, PlusIcon } from "@phosphor-icons/react";
import { TimezoneField } from "@/components/timezone-field";
import { suggestedDeadline } from "@/lib/setup-assist";
import { useEffect, useState } from "react";
import type { Wedding } from "@/lib/types";
import { useDraft } from "./use-draft";
import { DraftStatus } from "./draft-status";

export function SettingsManager({
  data,
  mutate,
  notify,
  onSaved,
  onPreviewChange,
}: PanelProps & {
  onSaved?: () => Promise<void>;
  onPreviewChange?: (value: Partial<Wedding>) => void;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const draft = useDraft(
    data.user.email + ":" + data.wedding.id + ":essentials",
    {
      names: data.wedding.names,
      date: data.wedding.date,
      rsvp_deadline: data.wedding.rsvp_deadline,
      location: data.wedding.location,
      timezone: data.wedding.timezone,
      locale: data.wedding.locale,
      privacy: data.wedding.privacy,
    },
  );
  const { date, rsvp_deadline: deadline, privacy } = draft.value;
  const change = (field: keyof typeof draft.value, value: string) =>
    draft.update((previous) => ({ ...previous, [field]: value }));
  const setDate = (value: string) => change("date", value);
  const setDeadline = (value: string) => change("rsvp_deadline", value);
  const setPrivacy = (value: string) => change("privacy", value);
  const serialized = JSON.stringify(draft.value);
  useEffect(() => {
    onPreviewChange?.(JSON.parse(serialized));
  }, [serialized, onPreviewChange]);
  return (
    <>
      <PageHeading
        title="The details behind the day."
        description={
          onSaved
            ? "Just the essentials. You can fine-tune everything later."
            : "Your wedding essentials, privacy, and publishing controls."
        }
      />
      <DraftStatus status={draft.status} discard={draft.discard} />
      {date && deadline && deadline > date && (
        <Notice error>
          The RSVP deadline is after the wedding. Choose an earlier date.
        </Notice>
      )}
      {date &&
        date !== data.wedding.date &&
        data.events.some((event) => event.starts_at.slice(0, 10) !== date) && (
          <p className="muted-copy">
            Changing the wedding date does not move existing events. Review
            their dates in the next chapter.
          </p>
        )}
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
            draft.clear();
            if (!onSaved) notify("Wedding settings saved.");
            await onSaved?.();
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
              <input
                name="names"
                value={draft.value.names}
                onChange={(e) => change("names", e.target.value)}
                required
              />
            </Field>
            <div className="form-grid">
              <Field label="Date">
                <input
                  name="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </Field>
              <Field
                label="RSVP deadline"
                hint="Give yourself time to confirm meals and seating. Check your venue’s final-count deadline."
              >
                <input
                  name="rsvp_deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  max={date}
                  required
                />
              </Field>
            </div>
            <div
              className="setup-shortcuts"
              aria-label="RSVP deadline suggestions"
            >
              <span>Set the reply deadline:</span>
              {[4, 6, 8].map((weeks) => (
                <button
                  type="button"
                  className="button outline small"
                  key={weeks}
                  disabled={!date}
                  onClick={() => setDeadline(suggestedDeadline(date, weeks))}
                >
                  {weeks} weeks before
                </button>
              ))}
            </div>
            <Field label="Location">
              <input
                name="location"
                value={draft.value.location}
                onChange={(e) => change("location", e.target.value)}
                required
              />
            </Field>
            <TimezoneField
              value={draft.value.timezone}
              onChange={(value) => change("timezone", value)}
              location={draft.value.location}
            />
            <Field label="Default guest language">
              <select
                name="locale"
                value={draft.value.locale}
                onChange={(e) => change("locale", e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </Field>
          </div>
        </section>
        {!onSaved && (
          <section>
            <div>
              <h2>Privacy & publishing</h2>
              <p>
                Personal events always require a guest invitation, even when
                your story is public.
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
        )}
        {onSaved && (
          <p className="muted-copy">
            Your existing privacy settings are kept. Publishing comes after your
            household preview; domains and billing can wait.
          </p>
        )}
        <div className="form-actions">
          <Submit pending={busy}>
            {onSaved ? "Save settings and continue" : "Save settings"}
            <CheckIcon size={17} />
          </Submit>
        </div>
      </form>
      {!onSaved && (
        <>
          <section className="settings-extra">
            <div>
              <h2>A name of your own.</h2>
              <p className="muted-copy">
                Connect a custom domain when deployed. DNS verification and SSL
                are managed through your hosting provider.
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
      )}
    </>
  );
}
