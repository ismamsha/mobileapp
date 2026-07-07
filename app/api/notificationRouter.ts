import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
} from "./queries/notifications";

export const notificationRouter = createRouter({
  list: authedQuery
    .input(z.object({ type: z.string().optional() }).optional())
    .query(({ ctx, input }) =>
      getUserNotifications(ctx.user.id, input?.type),
    ),

  unreadCount: authedQuery.query(({ ctx }) =>
    getUnreadCount(ctx.user.id),
  ),

  markRead: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await markNotificationRead(input.id, ctx.user.id);
      return { success: true };
    }),

  markAllRead: authedQuery.mutation(async ({ ctx }) => {
    await markAllNotificationsRead(ctx.user.id);
    return { success: true };
  }),
});
