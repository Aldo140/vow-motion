import type { World } from "./types";
// A world is not a palette. It is how the wedding speaks: the words it uses to
// greet a guest, the ornament it prints, and the mark that joins two names.
export type Voice = {
  kicker: string;
  invite: string;
  arrival: string;
  closing: string;
  script: string;
};
// Three worlds are photographed throughout; three are drawn, written and
// coloured but still borrow the house photography. That is recorded here so the
// marketing surfaces can say which is which instead of selling six of the same.
export type Photography = "complete" | "in-progress";
export const worlds: {
  id: World;
  name: string;
  description: string;
  couple: string;
  place: string;
  image: string;
  mood: string;
  photography: Photography;
  palette: string[];
  ornament: "silk" | "sprig" | "none";
  separator: string;
  voice: { en: Voice; es: Voice };
}[] = [
  {
    id: "riviera",
    name: "Riviera",
    description: "A love letter to the long Italian summer.",
    couple: "Elena & Matteo",
    place: "Lake Como, Italy",
    image: "/images/riviera.webp",
    mood: "/images/hero-riviera.webp",
    photography: "complete",
    palette: ["#efe9d9", "#40617a", "#858a66"],
    ornament: "silk",
    separator: "&",
    voice: {
      en: {
        kicker: "Together with our families",
        invite: "would love you to join us\nas we begin our forever.",
        arrival: "Some days deserve a little anticipation.",
        closing: "A day for love. A place for you.",
        script: "You are invited",
      },
      es: {
        kicker: "Junto con nuestras familias",
        invite:
          "nos encantaría que nos acompañaras\nen el comienzo de nuestro para siempre.",
        arrival: "Hay días que merecen un poquito de ilusión.",
        closing: "Un día para el amor. Un lugar para ti.",
        script: "Estás invitado",
      },
    },
  },
  {
    id: "maison",
    name: "Maison",
    description: "Parisian soul. An editorial point of view.",
    couple: "Amélie & Julien",
    place: "Provence, France",
    image: "/images/maison.webp",
    mood: "/images/hero-maison.webp",
    photography: "complete",
    palette: ["#f3f0e9", "#282824", "#9c8c7e"],
    ornament: "silk",
    separator: "&",
    voice: {
      en: {
        kicker: "Two families, one long table",
        invite: "request the pleasure of your company\nfor a very long lunch.",
        arrival: "Consider this the first course.",
        closing: "Come hungry. Stay late.",
        script: "You are invited",
      },
      es: {
        kicker: "Dos familias, una mesa larga",
        invite: "te esperamos\npara una comida muy larga.",
        arrival: "Considera esto el primer plato.",
        closing: "Ven con hambre. Quédate hasta tarde.",
        script: "Estás invitado",
      },
    },
  },
  {
    id: "notte",
    name: "Notte",
    description: "For a night that belongs only to you.",
    couple: "Isabel & Oliver",
    place: "New York, USA",
    image: "/images/notte.webp",
    mood: "/images/wedding-evening.webp",
    photography: "complete",
    palette: ["#1b1b1b", "#dfd0b6", "#6b343e"],
    ornament: "silk",
    separator: "&",
    voice: {
      en: {
        kicker: "The night is yours as much as ours",
        invite:
          "would be honoured by your company\nfor one unrepeatable night.",
        arrival: "The car is waiting.",
        closing: "One night. Everyone we love.",
        script: "You are invited",
      },
      es: {
        kicker: "La noche es tuya tanto como nuestra",
        invite: "nos honraría tu compañía\nen una noche irrepetible.",
        arrival: "El coche está esperando.",
        closing: "Una noche. Toda nuestra gente.",
        script: "Estás invitado",
      },
    },
  },
  {
    id: "heritage",
    name: "Heritage",
    description: "An occasion, beautifully inscribed.",
    couple: "Charlotte & James",
    place: "Cotswolds, England",
    image: "/images/heritage.webp",
    mood: "/images/wedding-details.webp",
    photography: "in-progress",
    palette: ["#ede8dc", "#514c36", "#a49a73"],
    ornament: "sprig",
    separator: "&",
    voice: {
      en: {
        kicker: "Together with their families",
        invite: "request the honour of your presence\nat the marriage of",
        arrival: "Kindly find your invitation within.",
        closing: "An occasion, and a place kept for you.",
        script: "You are invited",
      },
      es: {
        kicker: "Junto con sus familias",
        invite: "solicitan el honor de tu presencia\nen el enlace de",
        arrival: "Encontrarás tu invitación en el interior.",
        closing: "Una ocasión, y un lugar guardado para ti.",
        script: "Estás invitado",
      },
    },
  },
  {
    id: "modernist",
    name: "Modernist",
    description: "A little unexpected. Entirely yours.",
    couple: "Alex & Sam",
    place: "Copenhagen, Denmark",
    image: "/images/modernist.webp",
    mood: "/images/wedding-details.webp",
    photography: "in-progress",
    palette: ["#e5e7e6", "#263fa0", "#df693b"],
    ornament: "none",
    separator: "+",
    voice: {
      en: {
        kicker: "We are getting married",
        invite:
          "and we would like you there.\nNo speeches you have to sit through.",
        arrival: "Everything you need, in one place.",
        closing: "Good food. Good people. You.",
        script: "You are invited",
      },
      es: {
        kicker: "Nos casamos",
        invite: "y nos gustaría que estuvieras.\nSin discursos interminables.",
        arrival: "Todo lo que necesitas, en un solo lugar.",
        closing: "Buena comida. Buena gente. Tú.",
        script: "Estás invitado",
      },
    },
  },
  {
    id: "garden",
    name: "Garden",
    description: "Rooted in nature. Made for gathering.",
    couple: "Sofia & Luca",
    place: "Tuscany, Italy",
    image: "/images/garden.webp",
    mood: "/images/wedding-details.webp",
    photography: "in-progress",
    palette: ["#e6e9db", "#466044", "#aba58a"],
    ornament: "sprig",
    separator: "&",
    voice: {
      en: {
        kicker: "Under the olive trees",
        invite: "would love you to join us\nfor a day spent entirely outside.",
        arrival: "The table is being set.",
        closing: "Sun, shade, and all our favourite people.",
        script: "You are invited",
      },
      es: {
        kicker: "Bajo los olivos",
        invite:
          "nos encantaría que nos acompañaras\nun día entero al aire libre.",
        arrival: "Ya se está poniendo la mesa.",
        closing: "Sol, sombra y toda nuestra gente.",
        script: "Estás invitado",
      },
    },
  },
];
export const getWorld = (id: string) =>
  worlds.find((w) => w.id === id) || worlds[0];
export function formatDate(
  value: string,
  locale = "en",
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    timeZone: "UTC",
    ...options,
  }).format(new Date(value.length === 10 ? value + "T12:00:00Z" : value));
}
export function eventTime(value: string, zone: string, locale = "en") {
  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-GB", {
    timeZone: zone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
