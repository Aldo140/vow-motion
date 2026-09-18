import AuthForm from "@/components/auth-form";
import { currentUser } from "@/lib/auth";
import { enableStrictCsp } from "@/lib/csp-nonce";
export const dynamic = "force-dynamic";
export default async function Page() {
  await enableStrictCsp();
  const user = await currentUser();
  return <AuthForm register setup={!!user && !user.is_demo} />;
}
