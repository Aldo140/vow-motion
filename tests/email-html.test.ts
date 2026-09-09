import { describe, expect, it } from "vitest";
import { invitationEmailHtml } from "../src/lib/email-html";

describe("invitation email HTML", () => {
  it("escapes planner content while preserving the private invitation action", () => {
    const html = invitationEmailHtml({
      body: "Dear <Household>,\n\nOpen here:\nhttps://example.test/i/private",
      invitationLink: "https://example.test/i/private",
      couple: "Elena & Matteo",
      location: "Como",
    });
    expect(html).toContain("Dear &lt;Household&gt;");
    expect(html).not.toContain("Dear <Household>");
    expect(html).toContain('href="https://example.test/i/private"');
    expect(html).toContain("Elena &amp; Matteo");
    expect(html).toContain("reply directly");
  });
});
