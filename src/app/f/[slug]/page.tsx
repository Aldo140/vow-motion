import { notFound } from "next/navigation";
import { finderData } from "@/lib/finder-data";
import { worlds } from "@/lib/worlds";
import DayFinder from "@/components/day-finder";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Find your table",
  robots: { index: false, follow: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await finderData(slug);
  if (!data || !data.active) notFound();
  const world =
    worlds.find((w) => w.id === data.wedding.world) || worlds[0];
  return (
    <DayFinder
      slug={slug}
      names={data.wedding.names}
      date={data.wedding.date}
      location={data.wedding.location}
      locale={data.wedding.locale === "es" ? "es" : "en"}
      config={data.config}
      events={data.events as never[]}
      palette={world.palette}
      separator={world.separator}
      world={world.id}
      mood={world.mood}
    />
  );
}
