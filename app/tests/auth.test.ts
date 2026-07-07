process.env.APP_ID = "test-app";
process.env.APP_SECRET = "test-secret-at-least-32-bytes-long!";
process.env.DATABASE_URL = "mysql://localhost/test";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../api/router";
import { mockDb } from "./mocks/db";
import { Session } from "@contracts/constants";

vi.mock("../api/queries/connection", () => import("./mocks/db"));

describe("authRouter", () => {
  beforeEach(() => {
    mockDb.clear();
    vi.clearAllMocks();
  });

  describe("devLogin", () => {
    it("creates a user and returns a session cookie", async () => {
      mockDb.queueInsert([{ insertId: 1 }]);

      const testUser = {
        id: 42,
        unionId: "dev-test-user",
        name: "Test User",
        role: "user",
        lang: "en",
        email: null,
        avatar: null,
        phone: null,
        company: null,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-01"),
        lastSignInAt: new Date("2026-01-01"),
      } as const;

      mockDb.queueSelect([testUser]);

      const resHeaders = new Headers();
      const caller = appRouter.createCaller({
        req: new Request("http://localhost"),
        resHeaders,
      });

      const result = await caller.auth.devLogin();

      expect(result.success).toBe(true);
      expect(result.user).toEqual(testUser);

      const setCookie = resHeaders.get("set-cookie");
      expect(setCookie).toBeTruthy();
      expect(setCookie).toContain(Session.cookieName);
    });
  });

  describe("me", () => {
    it("requires authentication", async () => {
      const caller = appRouter.createCaller({
        req: new Request("http://localhost"),
        resHeaders: new Headers(),
      });

      await expect(caller.auth.me()).rejects.toThrow(TRPCError);
      try {
        await caller.auth.me();
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("UNAUTHORIZED");
      }
    });
  });
});
