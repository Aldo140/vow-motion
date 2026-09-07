import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import VerifyEmail from "@/components/verify-email";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Verify your email",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.email_verified) redirect("/studio");
  return <VerifyEmail email={user.email} />;
}
