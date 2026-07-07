import { authRouter } from "./auth-router";
import { factoryRouter } from "./factoryRouter";
import { favoriteRouter } from "./favoriteRouter";
import { chatRouter } from "./chatRouter";
import { notificationRouter } from "./notificationRouter";
import { rfqRouter } from "./rfqRouter";
import { adminRouter } from "./adminRouter";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  factory: factoryRouter,
  favorite: favoriteRouter,
  chat: chatRouter,
  notification: notificationRouter,
  rfq: rfqRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
