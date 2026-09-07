import Link from "next/link";
import { guestData } from "@/lib/data";
import GuestExperience from "@/components/guest-experience";
import { Brand } from "@/components/ui";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "An invitation for you",
  robots: { index: false, follow: false },
  openGraph: {
    title: "An invitation for you",
    description: "A little something, just for you.",
    images: [],
  },
};
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  let data;
  try {
    data = await guestData((await params).token);
  } catch {}
  if (data)
    return <GuestExperience initial={JSON.parse(JSON.stringify(data))} />;
  return (
    <main id="main" className="error-page">
      <Brand />
      <span>AN INVITATION, MISPLACED</span>
      <h1>This link is no longer available.</h1>
      <p>
        Your invitation may have expired or been replaced. Please ask your hosts
        for a new personal link.
      </p>
      <Link className="button primary" href="/">
        Back to Vow Motion
      </Link>
    </main>
  );
}
