"use client";
import {
  PageHeading,
  PreviewButton,
  type PanelProps,
} from "@/components/studio/shared";
import { Arrow, Notice } from "@/components/ui";
import { ImagesIcon } from "@phosphor-icons/react";

export function PhotosManager(props: PanelProps) {
  const { data, mutate, notify } = props;
  return (
    <>
      <PageHeading
        title="The moments between."
        description="A shared collection, seen through the eyes of your people."
      >
        <PreviewButton {...props} />
      </PageHeading>
      <Notice>
        Guests upload through their personal invitation. Photos stay private
        until you approve them.
      </Notice>
      {data.photos.length ? (
        <div className="photo-grid">
          {data.photos.map((p) => (
            <figure key={p.id}>
              <img
                src={"/api/photos/" + p.id}
                alt={p.caption || "A guest-shared wedding memory"}
              />
              <figcaption>
                <span>{p.caption || "A little memory"}</span>
                <span
                  className={"status " + (p.approved ? "attending" : "pending")}
                >
                  {p.approved ? "In the gallery" : "Awaiting approval"}
                </span>
              </figcaption>
              <div>
                <button
                  className="button outline small"
                  onClick={async () => {
                    await mutate(
                      "photos/" + p.id,
                      { approved: !p.approved },
                      "PATCH",
                    );
                    notify(
                      p.approved
                        ? "Photo hidden from guests."
                        : "Photo approved.",
                    );
                  }}
                >
                  {p.approved ? "Hide photo" : "Approve photo"}
                </button>
                <a
                  href={"/api/photos/" + p.id}
                  download={"memory-" + p.id + ".webp"}
                  className="text-link"
                >
                  Download <Arrow diagonal size={14} />
                </a>
              </div>
            </figure>
          ))}
        </div>
      ) : (
        <div className="empty-state photo-empty">
          <ImagesIcon size={40} />
          <h2>The best photos haven’t happened yet.</h2>
          <p>
            Invite your guests to add their perspective. Their uploads will
            arrive here for your approval.
          </p>
          <PreviewButton {...props} />
        </div>
      )}
    </>
  );
}
