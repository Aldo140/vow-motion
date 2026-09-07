import Link from "next/link";
import { Brand } from "@/components/ui";
export const metadata = { title: "Privacy information" };
export default function Page() {
  return (
    <main id="main" className="legal">
      <Brand />
      <h1>Your people’s details matter.</h1>
      <p>
        Vow Motion is currently a launch preview. This page explains the
        application’s implemented data handling; it is not a claim of legal
        certification.
      </p>
      <h2>Information in your wedding</h2>
      <p>
        The hosts manage guest names, contact details, invitation access, event
        replies, meal choices, dietary notes, seating, and uploaded photos.
        Personalized invitation links grant access to a household’s information.
        Keep them private.
      </p>
      <h2>Messages and consent</h2>
      <p>
        Guests can update contact details and withdraw messaging consent from
        their invitation. The local demo records messages in a development
        outbox and does not send email or SMS. Production sending requires a
        configured provider.
      </p>
      <h2>Photos</h2>
      <p>
        Uploaded images are resized and re-encoded to remove embedded metadata.
        Guests can see their own uploads; other guests see only photos approved
        by the hosts. Photo files are served through authorized endpoints.
      </p>
      <h2>Storage and accounts</h2>
      <p>
        Passwords use salted scrypt hashes. Session cookies are HTTP-only and
        expire after seven days. Invitation tokens are stored as hashes. Demo
        workspaces contain fictional data and are separate for each visitor.
      </p>
      <h2>Access, correction, and deletion</h2>
      <p>
        Guests can correct their contact details and responses using their
        invitation. Ask your hosts to export or remove guest information. Hosts
        can remove guests and photos in the Studio. Account-wide deletion is
        handled by the installation operator using the documented database
        procedure.
      </p>
      <h2>Before a public launch</h2>
      <p>
        The deployment operator must publish their legal identity, contact
        information, retention policy, and provider disclosures for the
        environment they operate.
      </p>
      <Link href="/">← Back to Vow Motion</Link>
    </main>
  );
}
