import type { Request } from "express";
import { verify } from "./auth.js";

export function getUserId(req: Request): number | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  return verify(token);
}
