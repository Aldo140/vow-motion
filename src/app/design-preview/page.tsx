import { access } from "@/lib/auth";
import { rows } from "@/lib/db";
import { safeWedding } from "@/lib/wedding-access";
import { designFromWedding } from "@/lib/wedding-design";
import DesignPreview from "@/components/studio/design-preview";
import type { GuestData, Wedding, Guest, Event, Travel } from "@/lib/types";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ wedding?: string }>;
}) {
  const { wedding } = await access((await searchParams).wedding || "");
  const safe = safeWedding(wedding) as Wedding;
  const state = (
    await rows("SELECT draft FROM wedding_designs WHERE wedding_id=$1", [
      safe.id,
    ])
  )[0];
  const data: GuestData = {
    wedding: safe,
    preview: true,
    guests: ["Sophie", "James"].map(
      (name, index) =>
        ({
          id: `sample-${index}`,
          name,
          household_id: "sample-household",
          wedding_id: safe.id,
          language: safe.locale,
          status: "pending",
          email: "",
          phone: "",
          address: "",
          tags: "",
          meal: "",
          dietary: "",
          notes: "",
          is_plus_one: false,
          consent: false,
        }) as Guest,
    ),
    household: "Sophie & James (sample household)",
    events: (await rows(
      "SELECT * FROM events WHERE wedding_id=$1 AND visibility='all' ORDER BY starts_at",
      [safe.id],
    )) as unknown as Event[],
    questions: [],
    travel: (await rows("SELECT * FROM travel_items WHERE wedding_id=$1", [
      safe.id,
    ])) as unknown as Travel[],
    faqs: [],
    registry: [],
    photos: [],
    responses: [],
    updates: [],
    token: "design-preview",
  };
  return (
    <DesignPreview
      initial={data}
      design={
        (state?.draft as ReturnType<typeof designFromWedding>) ??
        designFromWedding(safe)
      }
    />
  );
}
