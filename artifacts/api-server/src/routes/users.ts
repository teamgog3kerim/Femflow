import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  AuthUserBody,
  AuthUserResponse,
  GetMeResponse,
  UpdateMeBody,
  UpdateMeResponse,
} from "@workspace/api-zod";
import { sign, verify } from "../lib/auth.js";
import { serialize } from "../lib/serialize.js";

const router: IRouter = Router();

// POST /users/auth
router.post("/users/auth", async (req, res): Promise<void> => {
  const parsed = AuthUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;

  let [user] = await db.select().from(usersTable).where(eq(usersTable.telegramId, data.telegramId));

  if (!user) {
    [user] = await db
      .insert(usersTable)
      .values({
        telegramId: data.telegramId,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        username: data.username ?? null,
        language: data.language ?? "en",
      })
      .returning();
  }

  const token = sign(user.id);

  res.json(AuthUserResponse.parse(serialize({ user, token })));
});

// GET /users/me
router.get("/users/me", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetMeResponse.parse(serialize(user)));
});

// PATCH /users/me
router.patch("/users/me", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, userId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(UpdateMeResponse.parse(serialize(user)));
});

function getUserId(req: Parameters<typeof router.get>[1] extends (req: infer R, ...args: unknown[]) => unknown ? R : never): number | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  return verify(token);
}

export default router;
export { getUserId };
