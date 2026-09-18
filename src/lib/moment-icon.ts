import {
  ChampagneIcon,
  CoffeeIcon,
  ForkKnifeIcon,
  HeartIcon,
  MusicNotesIcon,
} from "@phosphor-icons/react";

const MOMENT_ICONS: [RegExp, typeof HeartIcon][] = [
  [/welcome|aperitivo|bienvenid|drinks|c[oó]ctel|cocktail/i, ChampagneIcon],
  [/ceremon|vows|boda|wedding/i, HeartIcon],
  [/reception|dinner|banquet|cena|celebraci/i, MusicNotesIcon],
  [/brunch|breakfast|desayuno|coffee|farewell|despedida/i, CoffeeIcon],
];

/** A small, warm signal of what kind of moment this is, guessed from its title. */
export function momentIcon(title: string) {
  return (
    MOMENT_ICONS.find(([pattern]) => pattern.test(title))?.[1] ?? ForkKnifeIcon
  );
}
