import Link from "next/link";
import { Brand } from "@/components/ui";
export default function NotFound() {
  return (
    <main id="main" className="error-page">
      <Brand />
      <span>A SMALL DETOUR</span>
      <h1>This page isn’t on the programme.</h1>
      <p>The address may have changed, or this wedding is not published yet.</p>
      <Link href="/" className="button primary">
        Back to Vow Motion
      </Link>
    </main>
  );
}
