import { db, transaction } from "./db";
import { id, token, hash, passwordHash } from "./auth";
import { getWorld } from "./worlds";
import type { World } from "./types";
export async function createWedding(
  ownerId: string,
  input: {
    names: string;
    date: string;
    location: string;
    world: World;
    timezone?: string;
  },
  demo = false,
) {
  const weddingId = id(),
    world = getWorld(input.world),
    slug =
      input.names
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      weddingId.slice(0, 6);
  const timezone =
    input.timezone ||
    (input.world === "notte"
      ? "America/New_York"
      : input.world === "maison"
        ? "Europe/Paris"
        : "Europe/Rome");
  const venue =
    input.world === "notte"
      ? "The Gramercy ballroom"
      : input.world === "maison"
        ? "Château des Amandiers"
        : "Villa del Balbianello";
  const welcome =
    input.world === "notte"
      ? "Cocktails in the city"
      : input.world === "maison"
        ? "An afternoon in the garden"
        : "A welcome aperitivo";
  const terrace =
    input.world === "notte"
      ? "The library bar"
      : input.world === "maison"
        ? "The fountain garden"
        : "The lakeside terrace";
  await transaction(async (c) => {
    await c.query(
      "INSERT INTO weddings(id,owner_id,slug,names,date,location,timezone,world,story,status,rsvp_deadline) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
      [
        weddingId,
        ownerId,
        slug,
        input.names,
        input.date,
        input.location,
        timezone,
        input.world,
        "What began with a chance meeting became a collection of little adventures. Now, our favourite people are coming together for the next chapter. We would love you to be part of it.",
        demo ? "published" : "draft",
        input.date,
      ],
    );
    // UTC instants and explicit IANA timezones; the event editor accepts offset-aware timestamps.
    const eventId = id();
    await c.query(
      "INSERT INTO events(id,wedding_id,title,title_es,starts_at,ends_at,timezone,venue,address,description,dress_code) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
      [
        eventId,
        weddingId,
        "The wedding",
        "La boda",
        input.date + "T14:00:00Z",
        input.date + "T22:00:00Z",
        timezone,
        demo ? venue : input.location,
        input.location,
        "An afternoon of vows, followed by dinner under the stars.",
        "Black tie, summer spirit",
      ],
    );
    for (const q of [
      [
        "Do you need the shuttle?",
        "¿Necesitas el transporte?",
        "select",
        ["No, thank you", "Yes, from the hotel"],
      ],
      ["A song for the dance floor", "Una canción para bailar", "text", []],
    ])
      await c.query(
        "INSERT INTO rsvp_questions(id,wedding_id,label,label_es,type,options) VALUES($1,$2,$3,$4,$5,$6)",
        [id(), weddingId, q[0], q[1], q[2], JSON.stringify(q[3])],
      );
    if (demo) {
      const names = [
        "Jessica Williams",
        "Daniel Williams",
        "Sophie Chen",
        "Oliver Chen",
        "James Bennett",
        "Charlotte Bennett",
        "Isabella Rossi",
        "Alessandro Rossi",
        "Emma Thompson",
        "William Thompson",
        "Sofia García",
        "Luis García",
        "Amelia Wilson",
        "Henry Wilson",
        "Mia Anderson",
        "Noah Anderson",
        "Ava Patel",
        "Arjun Patel",
        "Grace Kim",
        "Ethan Kim",
        "Florence Taylor",
        "George Taylor",
        "Lily Martin",
        "Jack Martin",
      ];
      for (let i = 0; i < names.length; i += 2) {
        const householdId = id();
        await c.query(
          "INSERT INTO households(id,wedding_id,name) VALUES($1,$2,$3)",
          [householdId, weddingId, names[i].split(" ").at(-1) + " household"],
        );
        for (let j = i; j < i + 2; j++) {
          const guestId = id(),
            status =
              i === 0 || i >= 18
                ? "pending"
                : i === 16
                  ? "declined"
                  : "attending";
          await c.query(
            "INSERT INTO guests(id,wedding_id,household_id,name,email,tags,status,meal,dietary,language,consent) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)",
            [
              guestId,
              weddingId,
              householdId,
              names[j],
              names[j].toLowerCase().replaceAll(" ", ".") + "@example.com",
              i < 8 ? "Family" : i < 16 ? "Friends, Out of town" : "Friends",
              status,
              status === "attending"
                ? j % 3 === 0
                  ? "Garden risotto"
                  : "Sea bass"
                : "",
              j === 4 ? "Gluten free" : "",
              i === 10 ? "es" : "en",
            ],
          );
          if (status !== "pending")
            await c.query(
              "INSERT INTO guest_event_responses(guest_id,event_id,attending,meal) VALUES($1,$2,$3,$4)",
              [
                guestId,
                eventId,
                status === "attending",
                j % 3 === 0 ? "Garden risotto" : "Sea bass",
              ],
            );
        }
      }
      const welcomeId = id();
      await c.query(
        "INSERT INTO events(id,wedding_id,title,title_es,starts_at,ends_at,timezone,venue,address,description,dress_code,visibility) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
        [
          welcomeId,
          weddingId,
          welcome,
          input.world === "notte"
            ? "Cócteles en la ciudad"
            : input.world === "maison"
              ? "Una tarde en el jardín"
              : "Aperitivo de bienvenida",
          input.date + "T10:00:00Z",
          input.date + "T12:00:00Z",
          timezone,
          terrace,
          input.location,
          "A glass of something lovely, and a chance to settle in.",
          "Relaxed tailoring",
          "private",
        ],
      );
      const hs = (
        await c.query<{ id: string }>(
          "SELECT id FROM households WHERE wedding_id=$1 ORDER BY created_at LIMIT 4",
          [weddingId],
        )
      ).rows;
      for (const h of hs)
        await c.query(
          "INSERT INTO event_guest_access(event_id,household_id) VALUES($1,$2)",
          [welcomeId, h.id],
        );
      await c.query(
        "INSERT INTO travel_items(id,wedding_id,title,type,description,address,url,price) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          id(),
          weddingId,
          input.world === "riviera"
            ? "A place by the lake"
            : "Stay a little longer",
          "hotel",
          input.world === "riviera"
            ? "We suggest staying in Lenno or Tremezzo, a short journey from the celebration. Book directly with your preferred hotel; accommodation is not included."
            : input.world === "maison"
              ? "Stay in the village of Gordes, surrounded by the hills of Provence. Book directly with your preferred hotel; accommodation is not included."
              : "Stay near Gramercy Park or Union Square for a short journey home after the last dance. Book directly with your preferred hotel; accommodation is not included.",
          input.location,
          "https://www.google.com/maps/search/?api=1&query=" +
            encodeURIComponent("hotels " + input.location),
          "Choose your own stay",
        ],
      );
      await c.query(
        "INSERT INTO travel_items(id,wedding_id,title,type,description,address) VALUES($1,$2,$3,$4,$5,$6)",
        [
          id(),
          weddingId,
          "Getting here",
          "transport",
          input.world === "notte"
            ? "Arrive through JFK or LaGuardia. We suggest taking a taxi or the subway to Manhattan. Leave extra time for city traffic."
            : input.world === "maison"
              ? "Arrive through Marseille Provence Airport, then take a car to Gordes. Let us know in your RSVP if you need a shuttle."
              : "Fly into Milan Malpensa. Allow around 90 minutes by car to the western shore of Lake Como. Let us know in your RSVP if you need a shuttle.",
          input.world === "notte"
            ? "Gramercy Park, New York"
            : input.world === "maison"
              ? "Marseille Provence Airport"
              : "Milan Malpensa Airport",
        ],
      );
      for (const name of ["Olivo", "Limone", "Cipresso"])
        await c.query(
          "INSERT INTO seating_tables(id,wedding_id,name,capacity) VALUES($1,$2,$3,8)",
          [id(), weddingId, name],
        );
      await c.query(
        "INSERT INTO messages(id,wedding_id,subject,body,audience,status) VALUES($1,$2,$3,$4,$5,$6)",
        [
          id(),
          weddingId,
          "A little note before we celebrate",
          "We cannot wait to see you by the lake. Please let us know your plans by the RSVP deadline.",
          "pending",
          "draft",
        ],
      );
      await c.query(
        "INSERT INTO audit_log(id,wedding_id,actor_id,action) VALUES($1,$2,$3,$4)",
        [id(), weddingId, ownerId, world.name + " demo wedding created"],
      );
    }
  });
  if (demo)
    await (
      await db()
    ).query("UPDATE weddings SET settings=$1 WHERE id=$2", [
      JSON.stringify({
        story_es:
          "Lo que comenzó con un encuentro inesperado se convirtió en una colección de pequeñas aventuras. Ahora, reunimos a nuestras personas favoritas para el próximo capítulo. Nos encantaría que formaras parte de él.",
      }),
      weddingId,
    ]);
  return weddingId;
}
export async function createDemo() {
  const userId = id();
  await (
    await db()
  ).query(
    "INSERT INTO users(id,email,name,password_hash,is_demo) VALUES($1,$2,$3,$4,true)",
    [userId, `demo-${userId}@example.invalid`, "Elena", passwordHash(token())],
  );
  for (const world of ["riviera", "maison", "notte"] as World[]) {
    const w = getWorld(world);
    await createWedding(
      userId,
      { names: w.couple, date: "2027-06-19", location: w.place, world },
      true,
    );
  }
  return userId;
}
export async function issueToken(weddingId: string, householdId: string) {
  const raw = token();
  await (
    await db()
  ).query(
    "INSERT INTO invitation_tokens(id,wedding_id,household_id,token_hash,expires_at) VALUES($1,$2,$3,$4,now()+interval '2 years')",
    [id(), weddingId, householdId, hash(raw)],
  );
  return raw;
}
