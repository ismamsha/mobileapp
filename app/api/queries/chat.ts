import { getDb } from "./connection";
import { chatMessages, factories } from "@db/schema";
import { eq, desc, like, or } from "drizzle-orm";

export async function getChatHistory(userId: number, limit = 50) {
  const db = getDb();
  return db.select().from(chatMessages)
    .where(eq(chatMessages.userId, userId))
    .orderBy(chatMessages.createdAt)
    .limit(limit);
}

export async function saveChatMessage(
  userId: number,
  role: "user" | "assistant",
  content: string,
  factoriesSuggested?: number[]
) {
  const db = getDb();
  await db.insert(chatMessages).values({
    userId,
    role,
    content,
    factoriesSuggested: factoriesSuggested ?? null,
  });
}

export async function searchFactoriesForAI(keywords: string[]) {
  const db = getDb();
  if (keywords.length === 0) return [];

  const conditions = keywords.flatMap((kw) => {
    const q = `%${kw}%`;
    return [
      like(factories.name, q),
      like(factories.description, q),
      like(factories.city, q),
      like(factories.primaryProducts, q),
    ];
  });

  const rows = await db.select({
    id: factories.id,
    name: factories.name,
    location: factories.location,
    rating: factories.rating,
    moq: factories.moq,
    isVerified: factories.isVerified,
    primaryProducts: factories.primaryProducts,
    heroImage: factories.heroImage,
  }).from(factories)
    .where(or(...conditions))
    .orderBy(desc(factories.rating))
    .limit(10);

  // Deduplicate while preserving rating order
  const seen = new Set<number>();
  return rows.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}
