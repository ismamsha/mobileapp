import { getDb } from "./connection";
import { factories, products, categories, certificates, factoryCertificates, factoryCategories, favorites, reviews, users, searchHistory, rfqs } from "@db/schema";
import { eq, like, and, or, desc, gte, lte, sql, inArray } from "drizzle-orm";

export async function findFactoryBySlug(slug: string) {
  const db = getDb();
  const [factory] = await db.select().from(factories).where(eq(factories.slug, slug)).limit(1);
  if (!factory) return null;

  // Increment view count
  await db.update(factories).set({ viewCount: (factory.viewCount ?? 0) + 1 }).where(eq(factories.id, factory.id));

  const factoryProducts = await db.select().from(products).where(eq(products.factoryId, factory.id));
  const factoryCerts = await db.select({
    name: certificates.name,
    type: certificates.type,
  }).from(factoryCertificates)
    .innerJoin(certificates, eq(factoryCertificates.certificateId, certificates.id))
    .where(eq(factoryCertificates.factoryId, factory.id));

  const factoryReviews = await db.select({
    id: reviews.id,
    rating: reviews.rating,
    comment: reviews.comment,
    verifiedPurchase: reviews.verifiedPurchase,
    createdAt: reviews.createdAt,
    userName: users.name,
  }).from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.factoryId, factory.id))
    .orderBy(desc(reviews.createdAt))
    .limit(10);

  return { ...factory, products: factoryProducts, certificates: factoryCerts, reviews: factoryReviews };
}

export async function findFactoryById(id: number) {
  const db = getDb();
  const [factory] = await db.select().from(factories).where(eq(factories.id, id)).limit(1);
  if (!factory) return null;

  // Increment view count
  await db.update(factories).set({ viewCount: (factory.viewCount ?? 0) + 1 }).where(eq(factories.id, factory.id));

  const factoryProducts = await db.select().from(products).where(eq(products.factoryId, factory.id));
  const factoryCerts = await db.select({
    name: certificates.name,
    type: certificates.type,
  }).from(factoryCertificates)
    .innerJoin(certificates, eq(factoryCertificates.certificateId, certificates.id))
    .where(eq(factoryCertificates.factoryId, factory.id));

  const factoryReviews = await db.select({
    id: reviews.id,
    rating: reviews.rating,
    comment: reviews.comment,
    verifiedPurchase: reviews.verifiedPurchase,
    createdAt: reviews.createdAt,
    userName: users.name,
  }).from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.factoryId, factory.id))
    .orderBy(desc(reviews.createdAt))
    .limit(10);

  return { ...factory, products: factoryProducts, certificates: factoryCerts, reviews: factoryReviews };
}

export async function searchFactories(query: string, opts?: {
  categoryId?: number;
  city?: string;
  minRating?: number;
  verified?: boolean;
  moqMax?: number;
  sortBy?: "relevance" | "rating" | "reviews" | "newest";
  limit?: number;
  offset?: number;
}) {
  const db = getDb();

  const conditions = [];

  if (query && query.trim()) {
    const terms = query.trim().split(/\s+/).filter(Boolean);
    const termConditions = terms.map((term) => {
      const q = `%${term}%`;
      return or(
        like(factories.name, q),
        like(factories.location, q),
        like(factories.description, q),
        like(factories.primaryProducts, q)
      );
    });
    if (termConditions.length > 0) {
      conditions.push(termConditions.length === 1 ? termConditions[0] : or(...termConditions));
    }
  }

  if (opts?.city) {
    conditions.push(like(factories.city, `%${opts.city}%`));
  }
  if (opts?.minRating) {
    conditions.push(gte(factories.rating, opts.minRating));
  }
  if (opts?.verified) {
    conditions.push(eq(factories.isVerified, true));
  }
  if (opts?.moqMax) {
    conditions.push(lte(factories.moqValue, opts.moqMax));
  }

  let factoryIds: number[] | undefined;
  if (opts?.categoryId) {
    const rows = await db.select({ factoryId: factoryCategories.factoryId })
      .from(factoryCategories)
      .where(eq(factoryCategories.categoryId, opts.categoryId));
    factoryIds = rows.map(r => r.factoryId);
    if (factoryIds.length === 0) {
      return { items: [], total: 0 };
    }
    conditions.push(inArray(factories.id, factoryIds));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const sortBy = opts?.sortBy ?? "relevance";
  const orderBy =
    sortBy === "rating" ? desc(factories.rating) :
    sortBy === "reviews" ? desc(factories.reviewCount) :
    sortBy === "newest" ? desc(factories.createdAt) :
    desc(factories.rating);

  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;

  const [countRows] = await db.select({ total: sql<number>`count(*)` }).from(factories).where(whereClause);
  const items = await db.select().from(factories)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  return { items, total: countRows.total };
}

export async function findFeaturedFactories(limit = 8) {
  const db = getDb();
  return db.select().from(factories)
    .where(eq(factories.featured, true))
    .orderBy(desc(factories.rating))
    .limit(limit);
}

export async function getAllCategories() {
  const db = getDb();
  return db.select().from(categories).orderBy(categories.sortOrder);
}

export async function getFactoryCities() {
  const db = getDb();
  const rows = await db.select({ city: factories.city }).from(factories).groupBy(factories.city).orderBy(factories.city);
  return rows.map(r => r.city);
}

export async function getRecentSearches(userId: number, limit = 10) {
  const db = getDb();
  return db.select().from(searchHistory)
    .where(eq(searchHistory.userId, userId))
    .orderBy(desc(searchHistory.createdAt))
    .limit(limit);
}

export async function saveSearchHistory(
  userId: number,
  query: string,
  filters?: Record<string, unknown>,
  resultCount?: number
) {
  const db = getDb();
  await db.insert(searchHistory).values({
    userId,
    query: query.slice(0, 255),
    filters: filters ?? null,
    resultCount: resultCount ?? 0,
  });
}

export async function deleteSearchHistory(userId: number, id: number) {
  const db = getDb();
  await db.delete(searchHistory).where(
    and(eq(searchHistory.userId, userId), eq(searchHistory.id, id)),
  );
  return { deleted: true };
}

export async function clearSearchHistory(userId: number) {
  const db = getDb();
  await db.delete(searchHistory).where(eq(searchHistory.userId, userId));
  return { cleared: true };
}

export async function getUserStats(userId: number) {
  const db = getDb();
  const [rfqRow] = await db.select({ count: sql<number>`count(*)` }).from(rfqs).where(eq(rfqs.userId, userId));
  const [favRow] = await db.select({ count: sql<number>`count(*)` }).from(favorites).where(eq(favorites.userId, userId));
  const [viewedRow] = await db.select({ count: sql<number>`count(distinct ${factories.id})` })
    .from(factories)
    .where(gte(factories.viewCount, 1));
  return {
    rfqCount: Number(rfqRow.count ?? 0),
    favoriteCount: Number(favRow.count ?? 0),
    viewedCount: Number(viewedRow.count ?? 0),
  };
}

export async function toggleFavorite(userId: number, factoryId: number) {
  const db = getDb();
  const existing = await db.select().from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.factoryId, factoryId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(favorites).where(eq(favorites.id, existing[0].id));
    return { favorited: false };
  } else {
    await db.insert(favorites).values({ userId, factoryId });
    return { favorited: true };
  }
}

export async function getUserFavorites(userId: number) {
  const db = getDb();
  return db.select({
    id: favorites.id,
    factoryId: favorites.factoryId,
    collectionName: favorites.collectionName,
    createdAt: favorites.createdAt,
    factoryName: factories.name,
    factoryLocation: factories.location,
    factoryImage: factories.heroImage,
    factoryRating: factories.rating,
    factoryMoq: factories.moq,
  }).from(favorites)
    .innerJoin(factories, eq(favorites.factoryId, factories.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));
}

export async function getFavoriteFactoryIds(userId: number) {
  const db = getDb();
  const rows = await db.select({ factoryId: favorites.factoryId }).from(favorites).where(eq(favorites.userId, userId));
  return new Set(rows.map(r => r.factoryId));
}

export async function removeFavorite(userId: number, factoryId: number) {
  const db = getDb();
  await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.factoryId, factoryId)));
  return { removed: true };
}
