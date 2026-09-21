import Link from "next/link";
import { Brand } from "@/components/ui";
import { operatorProfile } from "@/lib/operator";
export const metadata = { title: "Privacy information" };
export default function Page() {
  const operator = operatorProfile();
  return (
    <main id="main" className="legal">
      <Brand />
      <h1>Your people’s details matter.</h1>
      <p>
        Vow Motion is currently a launch preview. This page explains the
        application’s implemented data handling; it is not a claim of legal
        certification.
      </p>
      <h2>Who operates this deployment</h2>
      {operator.configured ? (
        <p>
          This deployment is operated by {operator.legalName}
          {operator.address ? `, ${operator.address}` : ""}, under{" "}
          {operator.jurisdiction} law. For privacy questions, requests, or a
          data breach report, contact{" "}
          <a href={`mailto:${operator.privacyContact}`}>
            {operator.privacyContact}
          </a>
          .
          {operator.privacyPolicyUrl && (
            <>
              {" "}
              The operator&rsquo;s full privacy policy is at{" "}
              <a href={operator.privacyPolicyUrl}>
                {operator.privacyPolicyUrl}
              </a>
              .
            </>
          )}
          {operator.termsUrl && (
            <>
              {" "}
              Terms of service:{" "}
              <a href={operator.termsUrl}>{operator.termsUrl}</a>.
            </>
          )}
        </p>
      ) : (
        <p>
          <strong>
            The operator running this deployment has not yet published their
            legal identity, jurisdiction, or a privacy contact here.
          </strong>{" "}
          Nothing below should be read as satisfying that requirement. See{" "}
          <code>docs/LEGAL-CHECKLIST.md</code> for what the operator needs to
          confirm and configure before accepting real guest data.
        </p>
      )}
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
      <h2>Contact enquiries</h2>
      <p>
        When you use our contact form, we store the details you submit and
        forward your enquiry to the Vow Motion team by email so we can reply.
        Contact enquiries do not sign you up for marketing, and are kept for
        up to two years. For questions about an enquiry or to request its
        removal, email{" "}
        {operator.privacyContact || "aldo@vowmotionweddings.com"}.
      </p>
      <h2>Photos</h2>
      <p>
        Uploaded images are resized and re-encoded to remove embedded metadata.
        Guests can see their own uploads; other guests see only photos approved
        by the hosts. Photo files are served through authorized endpoints.
      </p>
      <h2>Storage and accounts</h2>
      <p>Studio usage measurements help us understand which steps take effort. These contain only predefined action and screen names, counts, elapsed time and navigation counts. They do not contain wedding names, guest details, answers, messages, invitation links or a persistent tracking identifier. Demo measurements are separated. The browser’s Do Not Track preference disables collection.</p>
      <p>
        Passwords use salted scrypt hashes. Session cookies are HTTP-only and
        expire after seven days. Invitation tokens are stored as hashes. Demo
        workspaces contain fictional data and are separate for each visitor.
      </p>
      <h2>Access, correction, and deletion</h2>
      <p>
        Guests can correct their contact details and responses using their
        invitation. Ask your hosts to export or remove guest information. Hosts
        can remove guests and photos in the Studio. Account owners can export
        everything stored for their weddings, or schedule their own account for
        deletion, from Studio → Settings → Privacy centre. Deletion has a
        14-day grace period you can cancel, then removes owned weddings, their
        guest information, and their photo files.
      </p>
      <h2>Before a public launch</h2>
      <p>
        {operator.configured
          ? "Legal identity and a privacy contact are published above. The operator should still confirm actual provider regions and subprocessors, a written breach procedure, and jurisdiction-specific consent requirements (see docs/LEGAL-CHECKLIST.md) before treating this as a compliant public service."
          : "The deployment operator must publish their legal identity, contact information, retention policy, and provider disclosures for the environment they operate. None of that has been configured yet."}
      </p>
      <Link href="/">← Back to Vow Motion</Link>
    </main>
  );
}
