import { redirect } from "next/navigation";
import { studioData } from "@/lib/data";
import { rows } from "@/lib/db";
import { getWorld, formatDate, eventTime } from "@/lib/worlds";
import GuestCrest from "@/components/guest-crest";
import PrintButton from "@/components/print-button";
import type { Guest } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Day-of documents",
  robots: { index: false, follow: false },
};

const UNSEATED = "Not yet seated";

// One page of the set: a labelled head, the content, and the wedding it
// belongs to along the foot, so a loose sheet is never orphaned.
function Sheet({
  label,
  title,
  foot,
  children,
}: {
  label: string;
  title: string;
  foot: string;
  children: React.ReactNode;
}) {
  return (
    <article className="sheet">
      <header className="sheet-head">
        <span>{label}</span>
        <h2>{title}</h2>
      </header>
      {children}
      <footer className="sheet-foot">{foot}</footer>
    </article>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ wedding: string }>;
}) {
  const { wedding: weddingId } = await params;
  const data = await studioData(weddingId).catch(() => null);
  if (!data) redirect("/studio");

  const world = getWorld(data.wedding.world);
  const attending = data.guests.filter((g) => g.status === "attending");
  const seatOf = (guest: Guest) => guest.table_name || UNSEATED;
  const meals = [
    ...new Set(attending.map((g) => g.meal || "Not chosen")),
  ].sort();
  const events = [...data.events].sort(
    (a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at),
  );
  const shuttleQuestion = data.questions.find((q) =>
    /shuttle|transport|coach|bus/i.test(q.label),
  );
  const riders = shuttleQuestion
    ? await rows<{ name: string; household: string }>(
        `SELECT DISTINCT g.name, h.name household
         FROM guest_event_responses r
         JOIN guests g ON g.id=r.guest_id
         JOIN households h ON h.id=g.household_id
         WHERE g.wedding_id=$1 AND r.attending=true
           AND COALESCE(r.answers->>$2,'') <> ''
           AND r.answers->>$2 NOT ILIKE 'no%'
         ORDER BY h.name, g.name`,
        [weddingId, shuttleQuestion.id],
      )
    : [];

  const foot = `${data.wedding.names} · ${formatDate(data.wedding.date)} · ${data.wedding.location}`;

  return (
    <main
      className="documents"
      style={{ "--accent": world.palette[1] } as React.CSSProperties}
    >
      <div className="documents-bar">
        <div>
          <strong>Day-of documents</strong>
          <span>
            {data.wedding.names} · prepared{" "}
            {formatDate(new Date().toISOString().slice(0, 10))}
          </span>
        </div>
        <PrintButton />
      </div>

      <article className="sheet sheet-cover">
        <GuestCrest
          names={data.wedding.names}
          world={data.wedding.world}
          size={150}
        />
        <p className="cover-label">Day-of documents</p>
        <h1>{data.wedding.names}</h1>
        <p className="cover-date">{formatDate(data.wedding.date)}</p>
        <p className="cover-place">{data.wedding.location}</p>
        <dl className="cover-figures">
          {[
            ["Invited", data.guests.length],
            ["Attending", attending.length],
            ["Tables", data.tables.length],
            ["Seats on the shuttle", riders.length],
          ].map(([term, value]) => (
            <div key={String(term)}>
              <dt>{term}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <footer className="sheet-foot">
          Prepared from replies received. Numbers change as guests reply.
        </footer>
      </article>

      <Sheet foot={foot} label="The weekend" title="Order of the day">
        <ol className="sheet-schedule">
          {events.map((event) => (
            <li key={event.id}>
              <time dateTime={event.starts_at}>
                <b>{eventTime(event.starts_at, event.timezone)}</b>
                <span>
                  {formatDate(event.starts_at, "en", {
                    timeZone: event.timezone,
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </time>
              <div>
                <h3>{event.title}</h3>
                <p>{event.venue}</p>
                {event.dress_code && <small>{event.dress_code}</small>}
              </div>
            </li>
          ))}
        </ol>
      </Sheet>

      <Sheet foot={foot} label="For the caterer" title="Kitchen sheet">
        <table className="sheet-table">
          <thead>
            <tr>
              <th>Meal</th>
              <th className="figure">Covers</th>
            </tr>
          </thead>
          <tbody>
            {meals.map((meal) => (
              <tr key={meal}>
                <td>{meal}</td>
                <td className="figure">
                  {
                    attending.filter((g) => (g.meal || "Not chosen") === meal)
                      .length
                  }
                </td>
              </tr>
            ))}
            <tr className="total">
              <td>Total covers</td>
              <td className="figure">{attending.length}</td>
            </tr>
          </tbody>
        </table>

        <h3 className="sheet-subhead">Dietary requirements</h3>
        <table className="sheet-table">
          <thead>
            <tr>
              <th>Guest</th>
              <th>Table</th>
              <th>Meal</th>
              <th>Requirement</th>
            </tr>
          </thead>
          <tbody>
            {attending
              .filter((g) => g.dietary)
              .sort((a, b) => seatOf(a).localeCompare(seatOf(b)))
              .map((g) => (
                <tr key={g.id}>
                  <td>{g.name}</td>
                  <td>{seatOf(g)}</td>
                  <td>{g.meal}</td>
                  <td className="requirement">{g.dietary}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </Sheet>

      <Sheet foot={foot} label="For the room" title="Seating plan">
        <div className="sheet-tables">
          {data.tables.map((table) => {
            const seated = attending.filter((g) => g.table_name === table.name);
            return (
              <section key={table.id}>
                <h3>
                  {table.name}
                  <span>
                    {seated.length} / {table.capacity}
                  </span>
                </h3>
                <ul>
                  {seated.map((g) => (
                    <li key={g.id}>
                      {g.name}
                      {g.dietary && <em>{g.dietary}</em>}
                    </li>
                  ))}
                  {!seated.length && <li className="empty">Unassigned</li>}
                </ul>
              </section>
            );
          })}
        </div>
      </Sheet>

      <Sheet
        foot={foot}
        label="For the transport company"
        title="Shuttle manifest"
      >
        {shuttleQuestion ? (
          <>
            <p className="sheet-note">{shuttleQuestion.label}</p>
            <table className="sheet-table">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Household</th>
                </tr>
              </thead>
              <tbody>
                {riders.map((rider) => (
                  <tr key={rider.name + rider.household}>
                    <td>{rider.name}</td>
                    <td>{rider.household}</td>
                  </tr>
                ))}
                <tr className="total">
                  <td>Seats required</td>
                  <td className="figure">{riders.length}</td>
                </tr>
              </tbody>
            </table>
          </>
        ) : (
          <p className="sheet-note">No shuttle question has been asked.</p>
        )}
      </Sheet>

      <Sheet foot={foot} label="For the calligrapher" title="Place cards">
        <ul className="sheet-cards">
          {[...attending]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((g) => (
              <li key={g.id}>
                <span>{g.name}</span>
                <b>{seatOf(g)}</b>
              </li>
            ))}
        </ul>
      </Sheet>
    </main>
  );
}
