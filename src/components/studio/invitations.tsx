"use client";
import { Arrow, Notice } from "@/components/ui";
import { formatDate } from "@/lib/worlds";
import { useState } from "react";
import { PageHeading, type PanelProps } from "./shared";
export function Invitations({ data, mutate, notify }: PanelProps) {
  const [links, setLinks] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState("");
  return (
    <>
      <PageHeading
        title="It starts with an invitation."
        description="Personal links connect each household to the events meant for them."
      />
      <div className="invitation-workspace">
        <div className={"invitation-live-preview world-" + data.wedding.world}>
          <span>TOGETHER WITH OUR FAMILIES</span>
          <h2>{data.wedding.names.replace(" & ", "\n&\n")}</h2>
          <p>
            {formatDate(data.wedding.date)}
            <br />
            {data.wedding.location}
          </p>
          <div className="envelope-seal">
            {data.wedding.names
              .split(" & ")
              .map((n) => n[0])
              .join("")}
          </div>
          <small>We’ve saved a place for you.</small>
        </div>
        <div>
          <h2 className="serif-heading">Addressed with love.</h2>
          <p className="muted-copy">
            Create a private invitation, then copy it or share through WhatsApp.
            Regenerating a link retires the household’s older links.
          </p>
          {data.households.length === 0 ? (
            <Notice>
              Add your first guest in the guest list to prepare an invitation.
            </Notice>
          ) : (
            data.households.map((h) => (
              <div className="household-invite" key={h.id}>
                <div>
                  <b>{h.name}</b>
                  <small>
                    {data.guests
                      .filter((g) => g.household_id === h.id)
                      .map((g) => g.name)
                      .join(" & ")}
                  </small>
                </div>
                {!links[h.id] ? (
                  <button
                    className="button outline small"
                    disabled={busy === h.id}
                    onClick={async () => {
                      setBusy(h.id);
                      try {
                        const result = (await mutate("invitations", {
                          household_id: h.id,
                        })) as { url: string };
                        setLinks({ ...links, [h.id]: result.url });
                      } catch (e) {
                        notify((e as Error).message);
                      } finally {
                        setBusy("");
                      }
                    }}
                  >
                    Create link <Arrow size={14} />
                  </button>
                ) : (
                  <div className="invite-actions">
                    <button
                      className="text-link"
                      onClick={async () => {
                        await navigator.clipboard.writeText(links[h.id]);
                        notify("Invitation link copied.");
                      }}
                    >
                      Copy
                    </button>
                    <a href={links[h.id]}>
                      Open <Arrow diagonal size={13} />
                    </a>
                    <a
                      href={
                        "https://wa.me/?text=" +
                        encodeURIComponent(
                          `We would love you to join us. ${data.wedding.names} — your invitation: ${links[h.id]}`,
                        )
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp
                    </a>
                    <button
                      className="text-link"
                      onClick={async () => {
                        const r = (await mutate("invitations", {
                          household_id: h.id,
                          revoke: true,
                        })) as { url: string };
                        setLinks({ ...links, [h.id]: r.url });
                        notify("Previous links revoked. New link ready.");
                      }}
                    >
                      Regenerate
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
