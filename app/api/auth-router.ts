import * as cookie from "cookie";
import { z } from "zod";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { signSessionToken } from "./kimi/session";
import { upsertUser, findUserByUnionId, updateUser } from "./queries/users";
import { getUserStats } from "./queries/factories";
import { env } from "./lib/env";

async function setSessionCookie(
  ctx: { req: Request; resHeaders: Headers },
  unionId: string,
) {
  const token = await signSessionToken({
    unionId,
    clientId: env.appId || "dev",
  });
  const opts = getSessionCookieOptions(ctx.req.headers);
  ctx.resHeaders.append(
    "set-cookie",
    cookie.serialize(Session.cookieName, token, {
      httpOnly: opts.httpOnly,
      path: opts.path,
      sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
      secure: opts.secure,
      maxAge: Session.maxAgeMs / 1000,
    }),
  );
}

export const authRouter = createRouter({
  me: authedQuery.query((opts) => opts.ctx.user),

  stats: authedQuery.query(async ({ ctx }) =>
    getUserStats(ctx.user.id),
  ),

  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),
  devLogin: publicQuery.mutation(async ({ ctx }) => {
    const unionId = "dev-test-user";
    await upsertUser({
      unionId,
      name: "Test User",
      role: "user",
      lastSignInAt: new Date(),
    });
    await setSessionCookie(ctx, unionId);
    const user = await findUserByUnionId(unionId);
    return { success: true, user };
  }),
  devLoginAdmin: publicQuery.mutation(async ({ ctx }) => {
    const unionId = "dev-test-admin";
    await upsertUser({
      unionId,
      name: "Test Admin",
      role: "admin",
      lastSignInAt: new Date(),
    });
    await setSessionCookie(ctx, unionId);
    const user = await findUserByUnionId(unionId);
    return { success: true, user };
  }),

  updateProfile: authedQuery
    .input(
      z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        lang: z.enum(["en", "ar"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await updateUser(ctx.user.id, input);
      return { success: true };
    }),
});
