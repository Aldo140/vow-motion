import { redirect } from "next/navigation";
import { currentUser, isAdmin } from "@/lib/auth";
import { adminOverview } from "@/lib/admin";
import AdminDashboard from "@/components/admin-dashboard";
import { enableStrictCsp } from "@/lib/csp-nonce";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Operations",
  robots: { index: false, follow: false },
};

export default async function Page() {
  await enableStrictCsp();
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/studio");
  const data = await adminOverview();
  return <AdminDashboard data={data} me={user.email} />;
}
