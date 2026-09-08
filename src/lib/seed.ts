import { db, transaction } from "./db";
import { id, token, hash, passwordHash } from "./auth";
import { getWorld } from "./worlds";
import { eventInstant } from "./event-time";
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
    // The celebration spans a weekend, so resolve each day from the wedding
    // date at midday UTC, clear of any local daylight-saving change.
    const day = (offset: number) =>
      new Date(Date.parse(input.date + "T12:00:00Z") + offset * 86400000)
        .toISOString()
        .slice(0, 10);
    // Resolve the default gathering times in the venue's timezone, then store UTC.
    const ceremonyStart = eventInstant(input.date + "T16:00", timezone);
    const eventId = id();
    await c.query(
      "INSERT INTO events(id,wedding_id,title,title_es,starts_at,ends_at,timezone,venue,address,description,dress_code) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
      [
        eventId,
        weddingId,
        "The wedding",
        "La boda",
        ceremonyStart,
        new Date(Date.parse(ceremonyStart) + 8 * 3600000).toISOString(),
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
      const confirmed: string[] = [];
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
              j === 4
                ? "Gluten free"
                : j === 9
                  ? "Vegetarian"
                  : j === 13
                    ? "No nuts"
                    : j === 20
                      ? "Dairy free"
                      : "",
              i === 10 ? "es" : "en",
            ],
          );
          if (status === "attending") confirmed.push(guestId);
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
          eventInstant(day(-1) + "T18:00", timezone),
          eventInstant(day(-1) + "T21:00", timezone),
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
        "INSERT INTO events(id,wedding_id,title,title_es,starts_at,ends_at,timezone,venue,address,description,dress_code) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
        [
          id(),
          weddingId,
          "Farewell brunch",
          "Brunch de despedida",
          eventInstant(day(1) + "T10:30", timezone),
          eventInstant(day(1) + "T13:00", timezone),
          timezone,
          venue,
          input.location,
          "Coffee, something sweet, and slow goodbyes before you travel home.",
          "Come as you are",
        ],
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
      const tables: string[] = [];
      for (const name of ["Olivo", "Limone", "Cipresso"]) {
        const tableId = id();
        tables.push(tableId);
        await c.query(
          "INSERT INTO seating_tables(id,wedding_id,name,capacity) VALUES($1,$2,$3,8)",
          [tableId, weddingId, name],
        );
      }
      // Seat most confirmed households, two to a table so each stays together.
      // The remainder stays unseated, as the Studio's outstanding work.
      for (const [index, guestId] of confirmed.slice(0, 12).entries())
        await c.query(
          "INSERT INTO seat_assignments(guest_id,table_id) VALUES($1,$2)",
          [guestId, tables[Math.floor(index / 4)]],
        );
      for (const [title, search] of [
        ["A little something for the home", "wedding gift list"],
        ["The honeymoon fund", "honeymoon fund"],
      ])
        await c.query(
          "INSERT INTO registry_links(id,wedding_id,title,url) VALUES($1,$2,$3,$4)",
          [
            id(),
            weddingId,
            title,
            "https://www.google.com/search?q=" + encodeURIComponent(search),
          ],
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
  await createShowcaseWedding(userId);
  for (const world of ["maison", "notte"] as World[]) {
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

// A destination wedding at demonstration scale. The numbers are the point: a
// planner should see the shape of a real guest operation, not a sample of one.
// Everything is deterministic so the walkthrough tells the same story twice.
const SURNAMES = [
  "Williams",
  "Chen",
  "Bennett",
  "Rossi",
  "Thompson",
  "García",
  "Wilson",
  "Anderson",
  "Patel",
  "Kim",
  "Taylor",
  "Martin",
  "Moreau",
  "Okafor",
  "Lindqvist",
  "Hall",
  "Ferrari",
  "Nakamura",
  "Dubois",
  "Novak",
  "Silva",
  "Murphy",
  "Haddad",
  "Weber",
  "Castellano",
  "Bianchi",
  "Ahmed",
  "Larsen",
  "Romano",
  "Fischer",
  "Kowalski",
  "Mensah",
  "Costa",
  "Ivanov",
  "Reyes",
  "Bauer",
  "Conti",
  "Sørensen",
  "Nguyen",
  "Marchetti",
  "Petrov",
  "Delgado",
  "Ricci",
  "Baumann",
  "Esposito",
  "Vargas",
  "Lombardi",
  "Schneider",
  "Greco",
  "Aziz",
  "Pereira",
  "Moretti",
  "Andersson",
  "Barbieri",
  "Fontana",
  "Duarte",
  "Kaur",
  "Villa",
  "Serrano",
  "Blackwood",
  "Whitfield",
  "Ashby",
];
const FIRST_A = [
  "Jessica",
  "Sophie",
  "Charlotte",
  "Isabella",
  "Emma",
  "Sofía",
  "Amelia",
  "Mia",
  "Ava",
  "Grace",
  "Florence",
  "Lily",
  "Camille",
  "Adaeze",
  "Astrid",
  "Nadia",
  "Giulia",
  "Yuki",
  "Élise",
  "Petra",
  "Beatriz",
  "Niamh",
  "Layla",
  "Greta",
  "Valentina",
  "Chiara",
  "Zara",
  "Ingrid",
  "Aurora",
  "Marta",
];
const FIRST_B = [
  "Daniel",
  "Oliver",
  "James",
  "Alessandro",
  "William",
  "Luis",
  "Henry",
  "Noah",
  "Arjun",
  "Ethan",
  "George",
  "Jack",
  "Julien",
  "Chidi",
  "Anders",
  "Karim",
  "Marco",
  "Haruto",
  "Antoine",
  "Tomas",
  "Rafael",
  "Cian",
  "Omar",
  "Lukas",
  "Diego",
  "Matteo",
  "Idris",
  "Erik",
  "Nikolai",
  "Pablo",
];
const FIRST_C = [
  "Ruby",
  "Theo",
  "Ines",
  "Milo",
  "Freya",
  "Oscar",
  "Nina",
  "Felix",
  "Alba",
  "Hugo",
  "Cleo",
  "Rocco",
  "Maya",
  "Leo",
  "Iris",
  "Jonah",
  "Elsa",
  "Sami",
  "Rosa",
  "Kit",
  "Vera",
  "Otto",
  "Juno",
  "Emil",
];

// A stable shuffle, so a demo never reorders between two walkthroughs.
function spread<T>(items: T[]) {
  return items
    .map((item, index) => ({ item, key: (index * 2654435761) % 4294967291 }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);
}

export async function createShowcaseWedding(ownerId: string) {
  const weddingId = id(),
    timezone = "Europe/Rome",
    date = "2027-08-21",
    slug = "elena-matteo-" + weddingId.slice(0, 6);
  const day = (offset: number) =>
    new Date(Date.parse(date + "T12:00:00Z") + offset * 86400000)
      .toISOString()
      .slice(0, 10);

  // 62 households totalling exactly 150 guests, including eight children.
  const sizes: number[] = [];
  const childCounts: number[] = [];
  for (let i = 0; i < 62; i++) {
    if (i === 10 || i === 18 || i === 26 || i === 34) {
      sizes.push(4);
      childCounts.push(2);
    } else if (i % 11 === 4) {
      sizes.push(1);
      childCounts.push(0);
    } else if (i % 5 === 2) {
      sizes.push(3);
      childCounts.push(0);
    } else {
      sizes.push(2);
      childCounts.push(0);
    }
  }
  // Reach exactly 150 by growing households a few at a time. Dropping the
  // remainder on one of them would invent a fourteen-person family.
  const total = () => sizes.reduce((sum, n) => sum + n, 0);
  for (let i = 3; total() < 150; i = (i + 3) % 62)
    if (i !== 0 && sizes[i] < 4) sizes[i] += 1;

  // 22 awaiting a reply, 12 declined, 116 attending, spread through the list
  // rather than clustered at the top where a screenshot would catch them.
  const statuses: string[] = new Array(62).fill("attending");
  let pending = 22,
    declined = 12;
  for (let k = 0; k < 62 && (pending || declined); k++) {
    const i = (k * 7) % 62;
    if (pending >= sizes[i] && (i === 0 || k % 2 === 0)) {
      statuses[i] = "pending";
      pending -= sizes[i];
    } else if (declined >= sizes[i]) {
      statuses[i] = "declined";
      declined -= sizes[i];
    }
  }
  await transaction(async (c) => {
    await c.query(
      "INSERT INTO weddings(id,owner_id,slug,names,date,location,timezone,world,story,status,rsvp_deadline) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
      [
        weddingId,
        ownerId,
        slug,
        "Elena Moretti & Matteo Ricci",
        date,
        "Lake Como, Italy",
        timezone,
        "riviera",
        "We met on the wrong train, somewhere south of Milan, and spent the next eight years making a habit of the detour. Next August we are gathering everyone we love on the lake, for a weekend rather than an afternoon.",
        "published",
        "2027-07-10",
      ],
    );

    const events: Record<string, string> = {};
    for (const [
      key,
      title,
      titleEs,
      offset,
      from,
      to,
      venue,
      note,
      dress,
      visibility,
    ] of [
      [
        "welcome",
        "Welcome dinner",
        "Cena de bienvenida",
        -1,
        "19:00",
        "22:30",
        "The lakeside terrace",
        "Long tables under the lime trees, for those arriving early.",
        "Relaxed tailoring",
        "private",
      ],
      [
        "ceremony",
        "The ceremony",
        "La ceremonia",
        0,
        "16:00",
        "17:00",
        "Villa del Balbianello",
        "Vows on the loggia, looking out over the water.",
        "Black tie, summer spirit",
        "all",
      ],
      [
        "reception",
        "The reception",
        "La celebración",
        0,
        "18:00",
        "25:00",
        "Villa del Balbianello",
        "Dinner, speeches, and dancing until the boats go back.",
        "Black tie, summer spirit",
        "all",
      ],
      [
        "brunch",
        "Farewell brunch",
        "Brunch de despedida",
        1,
        "10:30",
        "13:00",
        "Hotel Riva terrace",
        "Coffee, something sweet, and slow goodbyes before you travel home.",
        "Come as you are",
        "private",
      ],
    ] as [
      string,
      string,
      string,
      number,
      string,
      string,
      string,
      string,
      string,
      string,
    ][]) {
      const eventId = id();
      events[key] = eventId;
      // A reception running past midnight ends on the following morning.
      const endHour = Number(to.slice(0, 2));
      const endsAt = eventInstant(
        day(offset + (endHour >= 24 ? 1 : 0)) +
          "T" +
          String(endHour % 24).padStart(2, "0") +
          to.slice(2),
        timezone,
      );
      await c.query(
        "INSERT INTO events(id,wedding_id,title,title_es,starts_at,ends_at,timezone,venue,address,description,dress_code,visibility,capacity) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
        [
          eventId,
          weddingId,
          title,
          titleEs,
          eventInstant(day(offset) + "T" + from, timezone),
          endsAt,
          timezone,
          venue,
          "Lake Como, Italy",
          note,
          dress,
          visibility,
          200,
        ],
      );
    }

    // Answers are stored against a question's own id, so the shuttle question
    // needs its id before any response is written against it.
    const shuttleQuestionId = id();
    for (const [questionId, q] of [
      [
        shuttleQuestionId,
        [
          "Do you need the shuttle?",
          "¿Necesitas el transporte?",
          "select",
          ["No, thank you", "Yes, from the hotel"],
        ],
      ],
      [
        id(),
        ["A song for the dance floor", "Una canción para bailar", "text", []],
      ],
    ] as [string, [string, string, string, string[]]][])
      await c.query(
        "INSERT INTO rsvp_questions(id,wedding_id,label,label_es,type,options) VALUES($1,$2,$3,$4,$5,$6)",
        [questionId, weddingId, q[0], q[1], q[2], JSON.stringify(q[3])],
      );

    // Meals for the 116 who are coming, including the eight children.
    const mealPool = spread([
      ...new Array(48).fill("Beef fillet"),
      ...new Array(37).fill("Sea bass"),
      ...new Array(18).fill("Garden risotto"),
      ...new Array(5).fill("Vegan plate"),
    ]);
    const severe = [
      "Severe nut allergy",
      "Coeliac, strictly gluten free",
      "Severe shellfish allergy",
      "Severe dairy allergy",
    ];
    let mealAt = 0,
      severeAssigned = 0,
      shuttleLeft = 63;
    const householdIds: string[] = [];
    const seatable: string[] = [];

    for (let h = 0; h < 62; h++) {
      const householdId = id(),
        surname = SURNAMES[h % SURNAMES.length],
        status = statuses[h],
        language = h === 12 || h === 29 || h === 44 ? "es" : "en";
      householdIds.push(householdId);
      await c.query(
        "INSERT INTO households(id,wedding_id,name) VALUES($1,$2,$3)",
        [householdId, weddingId, surname + " household"],
      );
      for (let m = 0; m < sizes[h]; m++) {
        const child = m >= sizes[h] - childCounts[h];
        const given = child
          ? FIRST_C[(h + m) % FIRST_C.length]
          : m === 0
            ? FIRST_A[h % FIRST_A.length]
            : m === 1
              ? FIRST_B[h % FIRST_B.length]
              : FIRST_C[(h * 3 + m) % FIRST_C.length];
        const guestId = id(),
          name = given + " " + surname;
        let meal = "",
          dietary = "";
        if (status === "attending") {
          if (child) meal = "Children\u2019s meal";
          else {
            meal = mealPool[mealAt++];
            // One note per household, so the kitchen list reads plausibly.
            if (severeAssigned < severe.length && m === 0 && h % 9 === 3)
              dietary = severe[severeAssigned++];
          }
        }
        await c.query(
          "INSERT INTO guests(id,wedding_id,household_id,name,email,tags,status,meal,dietary,language,consent,is_plus_one) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,$11)",
          [
            guestId,
            weddingId,
            householdId,
            name,
            name
              .toLowerCase()
              .replace(/[^a-z ]/g, "")
              .replaceAll(" ", ".") + "@example.com",
            child
              ? "Family, Children"
              : h < 18
                ? "Family"
                : h < 40
                  ? "Friends, Out of town"
                  : "Friends",
            status,
            meal,
            dietary,
            language,
            m === 2 && !child,
          ],
        );
        if (status === "attending") seatable.push(guestId);
        if (status !== "pending") {
          const shuttle = status === "attending" && shuttleLeft > 0;
          if (shuttle) shuttleLeft -= 1;
          const visible = ["ceremony", "reception"]
            .concat(h <= 19 ? ["welcome"] : [])
            .concat(h >= 5 && h <= 34 ? ["brunch"] : []);
          for (const key of visible)
            await c.query(
              "INSERT INTO guest_event_responses(guest_id,event_id,attending,meal,dietary,answers) VALUES($1,$2,$3,$4,$5,$6)",
              [
                guestId,
                events[key],
                status === "attending",
                meal,
                dietary,
                JSON.stringify(
                  shuttle ? { [shuttleQuestionId]: "Yes, from the hotel" } : {},
                ),
              ],
            );
        }
      }
    }

    for (let h = 0; h <= 19; h++)
      await c.query(
        "INSERT INTO event_guest_access(event_id,household_id) VALUES($1,$2)",
        [events.welcome, householdIds[h]],
      );
    for (let h = 5; h <= 34; h++)
      await c.query(
        "INSERT INTO event_guest_access(event_id,household_id) VALUES($1,$2)",
        [events.brunch, householdIds[h]],
      );

    const tableNames = [
      "Olivo",
      "Limone",
      "Cipresso",
      "Glicine",
      "Melograno",
      "Lavanda",
      "Ginepro",
      "Mirto",
      "Oleandro",
      "Rosmarino",
      "Camelia",
      "Magnolia",
      "Salvia",
      "Alloro",
      "Iris",
    ];
    const tables: string[] = [];
    for (const name of tableNames) {
      const tableId = id();
      tables.push(tableId);
      await c.query(
        "INSERT INTO seating_tables(id,wedding_id,name,capacity) VALUES($1,$2,$3,10)",
        [tableId, weddingId, name],
      );
    }
    // Most of the room is placed; the rest is the planner's outstanding work.
    for (let i = 0; i < Math.min(100, seatable.length); i++)
      await c.query(
        "INSERT INTO seat_assignments(guest_id,table_id) VALUES($1,$2)",
        [seatable[i], tables[Math.min(Math.floor(i / 7), tables.length - 1)]],
      );

    for (const [title, type, description, address] of [
      [
        "The hotel block",
        "hotel",
        "We hold rooms at Hotel Riva in Lenno until 10 July, under Moretti Ricci. Call the hotel directly and mention the wedding.",
        "Lenno, Lake Como",
      ],
      [
        "The shuttle",
        "transport",
        "Coaches leave Hotel Riva at 2:15pm on Saturday and return from the villa hourly from 11pm. Tell us in your RSVP if you need a seat.",
        "Hotel Riva, Lenno",
      ],
      [
        "Getting here",
        "transport",
        "Fly into Milan Malpensa, then around ninety minutes by car to the western shore. Trains run to Como, where the ferry crosses to Lenno.",
        "Milan Malpensa Airport",
      ],
    ] as [string, string, string, string][])
      await c.query(
        "INSERT INTO travel_items(id,wedding_id,title,type,description,address) VALUES($1,$2,$3,$4,$5,$6)",
        [id(), weddingId, title, type, description, address],
      );

    for (const [title, search] of [
      ["A little something for the home", "wedding gift list"],
      ["The honeymoon fund", "honeymoon fund"],
    ])
      await c.query(
        "INSERT INTO registry_links(id,wedding_id,title,url) VALUES($1,$2,$3,$4)",
        [
          id(),
          weddingId,
          title,
          "https://www.google.com/search?q=" + encodeURIComponent(search),
        ],
      );

    // The questions this wedding would otherwise receive by email.
    for (const [position, [question, questionEs, answer, answerEs]] of [
      [
        "Can I bring a guest?",
        "¿Puedo llevar acompañante?",
        "Your invitation names everyone we have room for at the villa. If it lists a guest, we would love to meet them.",
        "Tu invitación nombra a todas las personas para las que tenemos sitio. Si incluye acompañante, nos encantará conocerle.",
      ],
      [
        "What should I wear?",
        "¿Cómo me visto?",
        "Black tie with a summer spirit for Saturday, relaxed tailoring for the welcome dinner, and whatever you like for brunch. The terrace is stone, so bring a heel you can walk on.",
        "Etiqueta con aire veraniego el sábado, algo más relajado para la cena de bienvenida y lo que quieras para el brunch. La terraza es de piedra, así que trae un tacón cómodo.",
      ],
      [
        "Are children invited?",
        "¿Pueden ir los niños?",
        "Children named on your invitation are very welcome, and there is a children's menu at the reception.",
        "Los niños que aparecen en tu invitación son muy bienvenidos, y hay menú infantil en la celebración.",
      ],
      [
        "Is there a shuttle?",
        "¿Hay transporte?",
        "Coaches leave Hotel Riva at 2:15pm on Saturday and return from the villa hourly from 11pm. Tell us in your reply if you would like a seat.",
        "Los autocares salen del Hotel Riva a las 14:15 del sábado y vuelven desde la villa cada hora a partir de las 23:00. Dínoslo en tu respuesta si quieres plaza.",
      ],
      [
        "Can I take photographs?",
        "¿Puedo hacer fotos?",
        "Please keep phones away during the ceremony so everyone sees it with their own eyes. Afterwards, photograph everything, and add your favourites to the album here.",
        "Guarda el móvil durante la ceremonia para verla con tus propios ojos. Después, fotografía todo y sube tus favoritas al álbum.",
      ],
      [
        "When should I reply by?",
        "¿Hasta cuándo puedo responder?",
        "By 10 July, so the villa can be given final numbers. You can change your answer here at any time before then.",
        "Antes del 10 de julio, para dar los números finales a la villa. Puedes cambiar tu respuesta aquí hasta entonces.",
      ],
    ].entries())
      await c.query(
        "INSERT INTO faqs(id,wedding_id,question,question_es,answer,answer_es,position) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [id(), weddingId, question, questionEs, answer, answerEs, position],
      );

    await c.query(
      "INSERT INTO messages(id,wedding_id,subject,body,audience,status) VALUES($1,$2,$3,$4,$5,$6)",
      [
        id(),
        weddingId,
        "A gentle nudge before the deadline",
        "Elena and Matteo would love to hear from you. RSVPs close on 10 July, and the villa needs final numbers the week after.",
        "pending",
        "draft",
      ],
    );
    await c.query(
      "INSERT INTO audit_log(id,wedding_id,actor_id,action) VALUES($1,$2,$3,$4)",
      [id(), weddingId, ownerId, "Riviera showcase wedding created"],
    );
  });
  return weddingId;
}
