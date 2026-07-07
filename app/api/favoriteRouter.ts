import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { toggleFavorite, getUserFavorites, getFavoriteFactoryIds, removeFavorite } from "./queries/factories";

export const favoriteRouter = createRouter({
  list: authedQuery.query(({ ctx }) =>
    getUserFavorites(ctx.user.id),
  ),

  ids: authedQuery.query(({ ctx }) =>
    getFavoriteFactoryIds(ctx.user.id),
  ),

  toggle: authedQuery
    .input(z.object({ factoryId: z.number() }))
    .mutation(({ ctx, input }) =>
      toggleFavorite(ctx.user.id, input.factoryId),
    ),

  remove: authedQuery
    .input(z.object({ factoryId: z.number() }))
    .mutation(({ ctx, input }) =>
      removeFavorite(ctx.user.id, input.factoryId),
    ),
});
