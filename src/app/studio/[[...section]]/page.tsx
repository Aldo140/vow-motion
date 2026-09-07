import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { rows } from "@/lib/db";
import { listWeddings } from "@/lib/wedding-access";
import Studio from "@/components/studio";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Your Studio",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ section?: string[] }>;
  searchParams: Promise<{ wid?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const weddings = await listWeddings(user.id);
  if (!weddings.length) {
    if (
      !user.email_verified &&
      (
        await rows("SELECT id FROM collaborators WHERE lower(email)=$1", [
          user.email.toLowerCase(),
        ])
      ).length
    )
      redirect("/verify");
    redirect("/start?setup=1");
  }
  const requested = (await searchParams).wid;
  const selected = weddings.find((w) => w.id === requested) || weddings[0];
  return (
    <Studio
      key={String(selected.id)}
      section={(await params).section?.[0] || ""}
      initialId={String(selected.id)}
    />
  );
}
