import AuthForm from "@/components/auth-form";
import { currentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function Page() {
  const user = await currentUser();
  return <AuthForm register setup={!!user && !user.is_demo} />;
}
