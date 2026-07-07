process.env.APP_ID = "test-app";
process.env.APP_SECRET = "test-secret-at-least-32-bytes-long!";
process.env.DATABASE_URL = "mysql://localhost/test";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "../api/router";
import { mockDb } from "./mocks/db";

vi.mock("../api/queries/connection", () => import("./mocks/db"));

describe("factoryRouter", () => {
  beforeEach(() => {
    mockDb.clear();
    vi.clearAllMocks();
  });

  describe("search", () => {
    it("returns filtered results", async () => {
      mockDb.queueSelect([{ total: 1 }]);
      mockDb.queueSelect([
        {
          id: 1,
          name: "Precision Parts Co",
          slug: "precision-parts-co",
          location: "Dubai",
          city: "Dubai",
          province: "Dubai",
          description: "CNC machining specialist",
          rating: 4.5,
          reviewCount: 12,
          isVerified: true,
          featured: false,
          moqValue: 100,
        },
      ]);

      const caller = appRouter.createCaller({
        req: new Request("http://localhost"),
        resHeaders: new Headers(),
      });

      const result = await caller.factory.search({
        query: "CNC",
        city: "Dubai",
        minRating: 4,
        verified: true,
        moqMax: 500,
        sortBy: "rating",
      });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Precision Parts Co");
    });
  });

  describe("featured", () => {
    it("returns featured factories", async () => {
      mockDb.queueSelect([
        {
          id: 2,
          name: "Featured Factory",
          slug: "featured-factory",
          location: "Riyadh",
          city: "Riyadh",
          province: "Riyadh",
          description: "Top rated factory",
          rating: 4.9,
          reviewCount: 50,
          isVerified: true,
          featured: true,
        },
      ]);

      const caller = appRouter.createCaller({
        req: new Request("http://localhost"),
        resHeaders: new Headers(),
      });

      const result = await caller.factory.featured({ limit: 5 });

      expect(result).toHaveLength(1);
      expect(result[0].featured).toBe(true);
    });
  });
});
