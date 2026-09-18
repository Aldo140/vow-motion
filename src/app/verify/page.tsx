import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import VerifyEmail from "@/components/verify-email";
import { enableStrictCsp } from "@/lib/csp-nonce";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Verify your email",
  robots: { index: false, follow: false },
};
export default async function Page() {
  await enableStrictCsp();
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.email_verified) redirect("/studio");
  return <VerifyEmail email={user.email} />;
}
