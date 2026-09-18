import { rows } from "./db";
import { studioData } from "./data";

/**
 * Everything the couple already sees in Studio for every wedding they own,
 * bundled as one downloadable file. Read-only; nothing is changed or removed.
 */
export async function exportAccountData(userId: string) {
  const owned = await rows<{ id: string }>(
    "SELECT id FROM weddings WHERE owner_id=$1 ORDER BY created_at",
    [userId],
  );
  const weddings = [];
  for (const wedding of owned) {
    const data = await studioData(wedding.id);
    weddings.push({
      wedding: data.wedding,
      households: data.households,
      guests: data.guests,
      events: data.events,
      questions: data.questions,
      travel: data.travel,
      registry: data.registry,
      faqs: data.faqs,
      messages: data.messages,
      tables: data.tables,
      photos: data.photos.map((p) => ({ id: p.id, caption: p.caption, approved: p.approved })),
      collaborators: data.collaborators,
      domains: data.domains,
      responses: data.responses ?? [],
      guestRequests: data.guestRequests ?? [],
    });
  }
  return {
    exported_at: new Date().toISOString(),
    weddings,
  };
}
