import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  findFactoryBySlug,
  findFactoryById,
  searchFactories,
  findFeaturedFactories,
  getAllCategories,
  getFactoryCities,
  getRecentSearches,
  saveSearchHistory,
  deleteSearchHistory,
  clearSearchHistory,
} from "./queries/factories";
import { authedQuery } from "./middleware";

export const factoryRouter = createRouter({
  featured: publicQuery
    .input(z.object({ limit: z.number().min(1).max(20).optional() }).optional())
    .query(({ input }) => findFeaturedFactories(input?.limit ?? 8)),

  bySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => findFactoryBySlug(input.slug)),

  byId: publicQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => findFactoryById(input.id)),

  search: publicQuery
    .input(z.object({
      query: z.string().optional(),
      categoryId: z.number().optional(),
      city: z.string().optional(),
      minRating: z.number().optional(),
      verified: z.boolean().optional(),
      moqMax: z.number().optional(),
      sortBy: z.enum(["relevance", "rating", "reviews", "newest"]).optional(),
      limit: z.number().min(1).max(100).optional(),
      offset: z.number().min(0).optional(),
    }))
    .query(({ input }) => searchFactories(input.query ?? "", {
      categoryId: input.categoryId,
      city: input.city,
      minRating: input.minRating,
      verified: input.verified,
      moqMax: input.moqMax,
      sortBy: input.sortBy,
      limit: input.limit,
      offset: input.offset,
    })),

  categories: publicQuery.query(() => getAllCategories()),

  cities: publicQuery.query(() => getFactoryCities()),

  searchHistory: authedQuery.query(({ ctx }) =>
    getRecentSearches(ctx.user.id),
  ),

  saveSearch: authedQuery
    .input(z.object({
      query: z.string().min(1),
      filters: z.record(z.string(), z.any()).optional(),
      resultCount: z.number().optional(),
    }))
    .mutation(({ ctx, input }) =>
      saveSearchHistory(ctx.user.id, input.query, input.filters, input.resultCount),
    ),

  deleteSearchHistory: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      deleteSearchHistory(ctx.user.id, input.id),
    ),

  clearSearchHistory: authedQuery
    .mutation(({ ctx }) =>
      clearSearchHistory(ctx.user.id),
    ),
});
