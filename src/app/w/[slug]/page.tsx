import { rows } from "@/lib/db";
import { formatDate } from "@/lib/worlds";
import WeddingPhoto from "@/components/wedding-photo";
import type { Wedding } from "@/lib/types";
import { notFound } from "next/navigation";
import { Brand } from "@/components/ui";
import Lookup from "@/components/lookup";
import StoryUnlock from "@/components/story-unlock";
import { storyUnlocked } from "@/lib/wedding-access";
import { currentUser, isAdmin } from "@/lib/auth";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "A wedding story",
  robots: { index: false, follow: false },
  openGraph: {
    title: "A wedding story",
    description: "An invitation to celebrate.",
    images: [],
  },
};
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const w = (
    await rows("SELECT * FROM weddings WHERE slug=$1", [(await params).slug])
  )[0];
  if (!w) notFound();
  if (w.status === "draft" && !isAdmin(await currentUser())) notFound();
  const unlocked =
    w.privacy === "public" ||
    (w.privacy === "password" &&
      (await storyUnlocked(String(w.id), String(w.password_hash))));
  return (
    <main id="main" className="public-wedding">
      <Brand />
      {w.status === "draft" && (
        <p className="admin-preview-banner">
          Admin preview — this wedding hasn’t published yet, so guests can’t
          see this.
        </p>
      )}
      {unlocked ? (
        <>
          <WeddingPhoto wedding={w as unknown as Wedding} placement="invitation" alt="Our wedding invitation" />
          <h1>{String(w.names)}</h1>
          <p>
            {formatDate(String(w.date))} · {String(w.location)}
          </p>
          <p>{String(w.story)}</p>
        </>
      ) : w.privacy === "password" ? (
        <StoryUnlock slug={String(w.slug)} />
      ) : (
        <>
          <h1>You’re in the right place.</h1>
          <p>
            This celebration is private. Open your personal invitation to see
            the details.
          </p>
        </>
      )}
      <Lookup slug={String(w.slug)} />
    </main>
  );
}
