import { redirect } from "next/navigation";
import { currentUser, isAdmin } from "@/lib/auth";
import { listSocialPosts } from "@/lib/social";
import { instagramConfigured } from "@/lib/instagram";
import AdminContent from "@/components/admin-content";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Content",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/studio");
  const posts = await listSocialPosts();
  return (
    <AdminContent
      posts={posts as never[]}
      connected={instagramConfigured()}
    />
  );
}
