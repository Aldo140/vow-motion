import { notFound, redirect } from "next/navigation";
import { currentUser, isAdmin } from "@/lib/auth";
import { adminAccount } from "@/lib/admin";
import AdminAccount from "@/components/admin-account";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ user: string }>;
}) {
  const viewer = await currentUser();
  if (!viewer) redirect("/login");
  if (!isAdmin(viewer)) redirect("/studio");
  const account = await adminAccount((await params).user);
  if (!account) notFound();
  return <AdminAccount account={account} viewerId={viewer.id} />;
}
