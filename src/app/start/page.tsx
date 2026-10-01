import AuthForm from "@/components/auth-form";
import { currentUser } from "@/lib/auth";
import { enableStrictCsp } from "@/lib/csp-nonce";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata({
  title: "Create your wedding",
  description:
    "Start your wedding on Vow Motion: choose a design, add your events and guest list, and send digital invitations with household RSVPs. No card required.",
  path: "/start",
  card: "start",
});
export const dynamic = "force-dynamic";
export default async function Page() {
  await enableStrictCsp();
  const user = await currentUser();
  return <AuthForm register setup={!!user && !user.is_demo} />;
}
