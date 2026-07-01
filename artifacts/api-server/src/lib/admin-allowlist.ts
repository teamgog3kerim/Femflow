// Central allowlist of Telegram usernames that should have admin access.
// Configurable via ADMIN_USERNAMES (comma-separated); defaults to the app owner.
// Comparison is case-insensitive and tolerant of a leading "@".
const RAW = process.env.ADMIN_USERNAMES ?? "Femflowaiadm";

const ADMIN_USERNAMES: string[] = RAW.split(",")
  .map((s) => s.trim().toLowerCase().replace(/^@/, ""))
  .filter(Boolean);

export function isAdminUsername(username?: string | null): boolean {
  if (!username) return false;
  return ADMIN_USERNAMES.includes(username.trim().toLowerCase().replace(/^@/, ""));
}

// Enforce the single-admin invariant globally at startup: revoke admin from
// anyone not on the allowlist, and grant it to any existing user who is.
// Idempotent and safe to run on every boot (dev and production).
export async function syncAdminsToAllowlist(): Promise<void> {
  const { db, usersTable } = await import("@workspace/db");
  const { and, eq, ne, sql } = await import("drizzle-orm");

  const revoked = await db
    .update(usersTable)
    .set({ isAdmin: false })
    .where(
      and(
        eq(usersTable.isAdmin, true),
        sql`(${usersTable.username} IS NULL OR lower(${usersTable.username}) <> ALL(${ADMIN_USERNAMES}))`,
      ),
    )
    .returning({ id: usersTable.id });

  const granted =
    ADMIN_USERNAMES.length > 0
      ? await db
          .update(usersTable)
          .set({ isAdmin: true })
          .where(
            and(
              ne(usersTable.isAdmin, true),
              sql`lower(${usersTable.username}) = ANY(${ADMIN_USERNAMES})`,
            ),
          )
          .returning({ id: usersTable.id })
      : [];

  const { logger } = await import("./logger.js");
  logger.info(
    { revoked: revoked.length, granted: granted.length, allowlist: ADMIN_USERNAMES },
    "Admin allowlist synced",
  );
}
