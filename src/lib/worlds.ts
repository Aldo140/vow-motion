import type { World } from "./types";
export const worlds: {
  id: World;
  name: string;
  description: string;
  couple: string;
  place: string;
  image: string;
  palette: string[];
}[] = [
  {
    id: "riviera",
    name: "Riviera",
    description: "A love letter to the long Italian summer.",
    couple: "Elena & Matteo",
    place: "Lake Como, Italy",
    image: "/images/riviera.webp",
    palette: ["#efe9d9", "#40617a", "#858a66"],
  },
  {
    id: "maison",
    name: "Maison",
    description: "Parisian soul. An editorial point of view.",
    couple: "Amélie & Julien",
    place: "Provence, France",
    image: "/images/maison.webp",
    palette: ["#f3f0e9", "#282824", "#9c8c7e"],
  },
  {
    id: "notte",
    name: "Notte",
    description: "For a night that belongs only to you.",
    couple: "Isabel & Oliver",
    place: "New York, USA",
    image: "/images/notte.webp",
    palette: ["#1b1b1b", "#dfd0b6", "#6b343e"],
  },
  {
    id: "heritage",
    name: "Heritage",
    description: "An occasion, beautifully inscribed.",
    couple: "Charlotte & James",
    place: "Cotswolds, England",
    image: "/images/maison.webp",
    palette: ["#ede8dc", "#514c36", "#a49a73"],
  },
  {
    id: "modernist",
    name: "Modernist",
    description: "A little unexpected. Entirely yours.",
    couple: "Alex & Sam",
    place: "Copenhagen, Denmark",
    image: "/images/notte.webp",
    palette: ["#e5e7e6", "#263fa0", "#df693b"],
  },
  {
    id: "garden",
    name: "Garden",
    description: "Rooted in nature. Made for gathering.",
    couple: "Sofia & Luca",
    place: "Tuscany, Italy",
    image: "/images/riviera.webp",
    palette: ["#e6e9db", "#466044", "#aba58a"],
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
