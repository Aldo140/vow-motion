type AdminCandidate = {
  email: string;
  email_verified: boolean;
  is_demo: boolean;
  is_admin: boolean;
};

export function adminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(/[,\s]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

/** An allowlisted email is a claim until its ownership has been verified. */
export function isAdmin<T extends AdminCandidate>(user: T | null): user is T {
  return (
    !!user &&
    !user.is_demo &&
    user.email_verified &&
    (user.is_admin || adminEmails().includes(user.email.toLowerCase()))
  );
}
