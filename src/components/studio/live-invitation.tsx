"use client";
import WeddingPhoto from "../wedding-photo";
import type { Wedding, Event } from "@/lib/types";
import { getWorld, formatDate, eventTime } from "@/lib/worlds";
import { identityStyle, weddingIdentity } from "@/lib/identity";
import GuestCrest from "@/components/guest-crest";

export function LiveInvitation({
  wedding,
  events = [],
}: {
  wedding: Wedding;
  events?: Event[];
}) {
  const world = getWorld(wedding.world);
  return (
    <aside
      className={`live-invitation identity-suite world-${world.id}`}
      style={identityStyle(wedding.settings, world.id === "notte")}
      aria-label="Live invitation preview"
    >
      <span className="eyebrow">YOUR INVITATION, TAKING SHAPE</span>
      <WeddingPhoto wedding={wedding} placement="invitation" alt={`${world.name} invitation setting`} />
      <div className="live-invitation-paper">
        <GuestCrest
          names={wedding.names || "Your names"}
          world={world.id}
          monogram={weddingIdentity(wedding.settings).monogram}
        />
        <p>
          {wedding.locale === "es"
            ? "Te invitamos a celebrar"
            : "Together with our favourite people"}
        </p>
        <h2>{wedding.names || "Your names"}</h2>
        <p>
          {wedding.date
            ? formatDate(wedding.date, wedding.locale === "es" ? "es" : "en")
            : "A date to look forward to"}
        </p>
        <p>{wedding.location || "Somewhere special"}</p>
        {wedding.story && <blockquote>{wedding.story}</blockquote>}
        <small>
          {wedding.opening === "seal"
            ? "Sealed envelope opening"
            : "Invitation suite opening"}
        </small>
        {events.length > 0 && (
          <div className="live-programme">
            {events.map((event) => (
              <p key={event.id}>
                <b>{event.title}</b>
                <br />
                {eventTime(event.starts_at, event.timezone)} · {event.venue}
              </p>
            ))}
          </div>
        )}
      </div>
      <small>
        Design preview, including local edits. Use household preview to check
        private events and guest access.
      </small>
    </aside>
  );
}
