import { redirect } from "next/navigation";
import { currentUser, isAdmin } from "@/lib/auth";
import { adminOverview } from "@/lib/admin";
import AdminDashboard from "@/components/admin-dashboard";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Operations",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/studio");
  const data = await adminOverview();
  return <AdminDashboard data={data} me={user.email} />;
}
