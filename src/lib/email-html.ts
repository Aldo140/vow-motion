const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);

/** Small, table-based transactional email that remains readable in old clients. */
export function invitationEmailHtml(input: {
  body: string;
  invitationLink: string;
  couple: string;
  location?: string;
}) {
  const safeLink = escapeHtml(input.invitationLink);
  const paragraphs = input.body
    .split(/\n{2,}/)
    .map((paragraph) => {
      const lines = escapeHtml(paragraph).replaceAll("\n", "<br>");
      return `<p style="margin:0 0 18px;font:400 15px/1.7 Arial,sans-serif;color:#34352f">${lines.replaceAll(safeLink, `<a href="${safeLink}" style="color:#40553a;text-decoration:underline">${safeLink}</a>`)}</p>`;
    })
    .join("");

  return `<!doctype html><html><body style="margin:0;background:#f4f0e4"><div style="display:none;max-height:0;overflow:hidden">A private invitation from ${escapeHtml(input.couple)}.</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f0e4"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fffdf7;border:1px solid #d9d4c6"><tr><td style="padding:42px 42px 34px"><p style="margin:0 0 22px;font:600 10px/1.4 Arial,sans-serif;letter-spacing:2px;color:#63705d">A PRIVATE INVITATION</p><h1 style="margin:0 0 28px;font:400 38px/1.1 Georgia,serif;color:#26382f">${escapeHtml(input.couple)}</h1>${paragraphs}<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0"><tr><td style="background:#40553a"><a href="${safeLink}" style="display:inline-block;padding:15px 24px;font:600 13px Arial,sans-serif;color:#fffdf7;text-decoration:none">Open your private invitation&nbsp;&nbsp;→</a></td></tr></table><p style="margin:28px 0 0;padding-top:18px;border-top:1px solid #d9d4c6;font:400 11px/1.6 Arial,sans-serif;color:#76766e">Sent personally through Vow Motion${input.location ? ` for the celebration in ${escapeHtml(input.location)}` : ""}. You can reply directly to this email if you need help.</p></td></tr></table></td></tr></table></body></html>`;
}
