import AuthForm from "@/components/auth-form";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;
  return (
    <AuthForm
      notice={
        demo === "busy"
          ? "The private demo has been opened many times from this network. Please try again in fifteen minutes, or sign in to your own Studio below."
          : ""
      }
    />
  );
}
