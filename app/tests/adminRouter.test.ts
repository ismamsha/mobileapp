process.env.APP_ID = "test-app";
process.env.APP_SECRET = "test-secret-at-least-32-bytes-long!";
process.env.DATABASE_URL = "mysql://localhost/test";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "../api/router";
import { mockDb } from "./mocks/db";
import { rfqs } from "@db/schema";

vi.mock("../api/queries/connection", () => import("./mocks/db"));
const adminCtx = {
  req: new Request("http://localhost"),
  resHeaders: new Headers(),
  user: {
    id: 1,
    unionId: "admin-1",
    name: "Admin",
    role: "admin",
    lang: "en",
    email: "admin@example.com",
    avatar: null,
    phone: null,
    company: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignInAt: new Date(),
  } as const,
};

describe("adminRouter", () => {
  beforeEach(() => {
    mockDb.clear();
    vi.clearAllMocks();
  });

  describe("stats", () => {
    it("returns correct counts", async () => {
      mockDb.queueSelect([{ count: 5 }]);
      mockDb.queueSelect([{ count: 10 }]);
      mockDb.queueSelect([{ count: 2 }]);
      mockDb.queueSelect([{ count: 3 }]);
      mockDb.queueSelect([{ count: 7 }]);
      mockDb.queueSelect([{ avg: "4.5" }]);
      mockDb.queueSelect([{ count: 4 }]);
      mockDb.queueSelect([{ count: 2 }]);
      mockDb.queueSelect([{ count: 1 }]);
      mockDb.queueSelect([]);
      mockDb.queueSelect([]);
      mockDb.queueSelect([]);
      mockDb.queueSelect([]);
      mockDb.queueSelect([]);
      mockDb.queueSelect([]);

      const caller = appRouter.createCaller(adminCtx);
      const result = await caller.admin.stats();

      expect(result.counts).toEqual({
        users: 5,
        factories: 10,
        rfqs: 2,
        favorites: 3,
        chats: 7,
        verified: 4,
        featured: 2,
        pendingRFQs: 1,
        avgRating: 4.5,
      });
      expect(result.recentUsers).toEqual([]);
      expect(result.factoriesByCategory).toEqual([]);
      expect(result.rfqsByStatus).toEqual([]);
      expect(result.usersOverTime).toHaveLength(12);
      expect(result.rfqsOverTime).toHaveLength(12);
    });
  });

  describe("factoryList", () => {
    it("filters, sorts and paginates factories", async () => {
      mockDb.queueSelect([{ total: 1 }]);
      mockDb.queueSelect([
        {
          id: 1,
          name: "Cairo Factory",
          slug: "cairo-factory",
          location: "Cairo",
          city: "Cairo",
          province: "Cairo Governorate",
          description: "A factory in Cairo",
          rating: 4.8,
          reviewCount: 10,
          featured: true,
          isVerified: true,
          gallery: null,
          exportMarkets: null,
          primaryProducts: null,
        },
      ]);
      mockDb.queueSelect([]);
      mockDb.queueSelect([]);
      mockDb.queueSelect([]);

      const caller = appRouter.createCaller(adminCtx);
      const result = await caller.admin.factoryList({
        search: "Cairo",
        city: "Cairo",
        isVerified: "true",
        featured: "all",
        sortBy: "rating",
        sortOrder: "desc",
        page: 1,
        pageSize: 2,
      });

      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Cairo Factory");
      expect(result.items[0].categoryIds).toEqual([]);
      expect(result.items[0].certificateIds).toEqual([]);
      expect(result.items[0].productCount).toBe(0);
    });
  });

  describe("factoryCreate", () => {
    it("fails when a duplicate slug is inserted", async () => {
      mockDb.queueInsert(
        new Error("Duplicate entry 'test-slug' for key 'factories.slug'"),
      );

      const caller = appRouter.createCaller(adminCtx);
      await expect(
        caller.admin.factoryCreate({
          name: "Test Factory",
          slug: "test-slug",
          location: "Test Location",
          city: "Test City",
          province: "Test Province",
          description: "Test description",
        }),
      ).rejects.toThrow();
    });
  });

  describe("rfqUpdateStatus", () => {
    it("updates the RFQ status", async () => {
      mockDb.queueUpdate([]);

      const caller = appRouter.createCaller(adminCtx);
      const result = await caller.admin.rfqUpdateStatus({
        id: 1,
        status: "responded",
      });

      expect(result).toEqual({ success: true });
      expect(mockDb.update).toHaveBeenCalledWith(rfqs);
    });
  });
});
