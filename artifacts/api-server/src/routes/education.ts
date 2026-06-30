import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, articlesTable } from "@workspace/db";
import {
  GetArticleParams,
  GetArticleResponse,
  ListArticlesResponse,
} from "@workspace/api-zod";
import { serialize } from "../lib/serialize.js";

const router: IRouter = Router();

// GET /articles
router.get("/articles", async (req, res): Promise<void> => {
  const category = String(req.query.category ?? "");
  const language = String(req.query.language ?? "en");

  const conditions = [eq(articlesTable.isPublished, true)];
  if (category) conditions.push(eq(articlesTable.category, category));
  if (language) conditions.push(eq(articlesTable.language, language));

  const articles = await db
    .select()
    .from(articlesTable)
    .where(and(...conditions))
    .orderBy(articlesTable.createdAt);

  res.json(ListArticlesResponse.parse(serialize(articles)));
});

// GET /articles/:id
router.get("/articles/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetArticleParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [article] = await db.select().from(articlesTable).where(eq(articlesTable.id, params.data.id));
  if (!article) { res.status(404).json({ error: "Article not found" }); return; }
  res.json(GetArticleResponse.parse(serialize(article)));
});

export default router;
