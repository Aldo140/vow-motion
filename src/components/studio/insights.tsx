"use client";
import { Arrow } from "@/components/ui";
import { PageHeading, type PanelProps } from "./shared";
export function Insights({ data }: PanelProps) {
  const attending = data.guests.filter((g) => g.status === "attending"),
    meals = [...new Set(attending.map((g) => g.meal).filter(Boolean))];
  return (
    <>
      <PageHeading
        title="The full picture."
        description="Real responses from your guest list, beautifully in view."
      >
        <a
          className="button outline"
          href={"/api/studio/export?wedding=" + data.wedding.id}
        >
          Export guest report <Arrow diagonal />
        </a>
      </PageHeading>
      {/* The documents a planner otherwise rebuilds by hand for each vendor. */}
      <section className="day-documents">
        <div>
          <h2>Day-of documents</h2>
          <p className="muted-copy">
            Built from the replies you already have, in the form each supplier
            asks for. They open in any spreadsheet.
          </p>
        </div>
        <a
          className="day-document day-document-set"
          href={`/documents/${data.wedding.id}`}
          target="_blank"
          rel="noreferrer"
        >
          <span className="day-document-for">The whole set, typeset</span>
          <h3>
            Print the day-of book
            <Arrow diagonal size={15} />
          </h3>
          <p>
            Cover, order of the day, kitchen sheet, seating plan, shuttle
            manifest and place cards, set in your wedding&rsquo;s own type and
            ready for the printer.
          </p>
        </a>
        <div className="day-document-list">
          {(
            [
              [
                "kitchen",
                "Kitchen sheet",
                "Covers by meal, every dietary requirement with its table, and covers per table.",
                "For the caterer",
              ],
              [
                "shuttle",
                "Shuttle manifest",
                "Everyone who asked for a seat, by household, with the number of seats required.",
                "For the transport company",
              ],
              [
                "placecards",
                "Place cards",
                "Every attending guest alphabetically, with table, meal and dietary note.",
                "For the calligrapher and the venue",
              ],
            ] as const
          ).map(([sheet, title, description, audience]) => (
            <a
              key={sheet}
              className="day-document"
              href={`/api/studio/export?wedding=${data.wedding.id}&sheet=${sheet}`}
            >
              <span className="day-document-for">{audience}</span>
              <h3>
                {title}
                <Arrow diagonal size={15} />
              </h3>
              <p>{description}</p>
            </a>
          ))}
        </div>
      </section>
      <div className="insight-grid">
        <section>
          <h2>Attendance</h2>
          {(["attending", "pending", "declined"] as const).map((status) => {
            const count = data.guests.filter((g) => g.status === status).length;
            return (
              <div className="insight-bar" key={status}>
                <p>
                  <span>
                    {status === "pending"
                      ? "Awaiting reply"
                      : status === "declined"
                        ? "Unable to attend"
                        : "Attending"}
                  </span>
                  <strong>{count}</strong>
                </p>
                <div>
                  <span
                    style={{
                      width: `${(count / Math.max(1, data.guests.length)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </section>
        <section>
          <h2>At the table</h2>
          {meals.length ? (
            meals.map((meal) => (
              <div className="report-line" key={meal}>
                <span>{meal}</span>
                <strong>
                  {attending.filter((g) => g.meal === meal).length}
                </strong>
              </div>
            ))
          ) : (
            <p>No meal choices yet.</p>
          )}
          <h3>Dietary notes</h3>
          {attending
            .filter((g) => g.dietary)
            .map((g) => (
              <div className="report-line" key={g.id}>
                <span>{g.name}</span>
                <b>{g.dietary}</b>
              </div>
            ))}
        </section>
        <section>
          <h2>Invitation delivery</h2>
          <p className="muted-copy">
            Provider acceptance is separate from delivery. Email opens are not a
            reliable measure of readership.
          </p>
          {["sent", "delivered", "failed", "development"].map((status) => (
            <div className="report-line" key={status}>
              <span>
                {status === "development" ? "Development outbox" : status}
              </span>
              <strong>
                {data.deliveries.filter((d) => d.status === status).length}
              </strong>
            </div>
          ))}
        </section>
        <section>
          <h2>Studio activity</h2>
          {data.activity.map((a) => (
            <div className="report-line" key={a.id}>
              <span>{a.action}</span>
              <small>{new Date(a.created_at).toLocaleDateString()}</small>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
