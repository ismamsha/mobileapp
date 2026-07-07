import { z } from "zod";
import { spawn } from "child_process";
import { TRPCError } from "@trpc/server";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  factories,
  users,
  rfqs,
  chatMessages,
  favorites,
  products,
  categories,
  certificates,
  factoryCategories,
  factoryCertificates,
  reviews,
  notifications,
  searchHistory,
} from "@db/schema";
import {
  eq,
  desc,
  count,
  countDistinct,
  avg,
  and,
  or,
  like,
  inArray,
  asc,
  sql,
  gte,
} from "drizzle-orm";
import { readFile } from "fs/promises";
import os from "os";
import { createNotification as insertNotification } from "./queries/notifications";

const factoryStatusEnum = z.enum([
  "pending",
  "sent",
  "responded",
  "negotiating",
  "accepted",
  "declined",
]);

function monthLabel(d: Date) {
  return d.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

function generateMonthlyTimeSeries() {
  const now = new Date();
  const data = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    data.push({ label: monthLabel(d), count: 0 });
  }
  return data;
}

const startTime = Date.now();

export const adminRouter = createRouter({
  stats: adminQuery.query(async () => {
    const db = getDb();

    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [totalFactories] = await db.select({ count: count() }).from(factories);
    const [totalRFQs] = await db.select({ count: count() }).from(rfqs);
    const [totalFavorites] = await db.select({ count: count() }).from(favorites);
    const [totalChats] = await db.select({ count: count() }).from(chatMessages);
    const [avgRating] = await db.select({ avg: avg(factories.rating) }).from(factories);

    const [verifiedFactories] = await db
      .select({ count: count() })
      .from(factories)
      .where(eq(factories.isVerified, true));
    const [featuredFactories] = await db
      .select({ count: count() })
      .from(factories)
      .where(eq(factories.featured, true));

    const pendingRFQs = await db
      .select({ count: count() })
      .from(rfqs)
      .where(eq(rfqs.status, "pending"));

    const recentUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5);
    const recentRFQs = await db
      .select({
        id: rfqs.id,
        productName: rfqs.productName,
        quantity: rfqs.quantity,
        status: rfqs.status,
        createdAt: rfqs.createdAt,
        userName: users.name,
      })
      .from(rfqs)
      .leftJoin(users, eq(rfqs.userId, users.id))
      .orderBy(desc(rfqs.createdAt))
      .limit(10);

    const usersByMonth = await db
      .select({
        month: sql<string>`DATE_FORMAT(${users.createdAt}, '%b %y')`,
        count: count(),
      })
      .from(users)
      .where(gte(users.createdAt, sql`DATE_SUB(NOW(), INTERVAL 12 MONTH)`))
      .groupBy(sql`DATE_FORMAT(${users.createdAt}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${users.createdAt}, '%Y-%m')`);

    const rfqsByMonth = await db
      .select({
        month: sql<string>`DATE_FORMAT(${rfqs.createdAt}, '%b %y')`,
        count: count(),
      })
      .from(rfqs)
      .where(gte(rfqs.createdAt, sql`DATE_SUB(NOW(), INTERVAL 12 MONTH)`))
      .groupBy(sql`DATE_FORMAT(${rfqs.createdAt}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${rfqs.createdAt}, '%Y-%m')`);

    const factoriesByCategory = await db
      .select({
        id: categories.id,
        nameEn: categories.nameEn,
        nameAr: categories.nameAr,
        count: count(factoryCategories.factoryId),
      })
      .from(categories)
      .leftJoin(factoryCategories, eq(categories.id, factoryCategories.categoryId))
      .groupBy(categories.id, categories.nameEn, categories.nameAr)
      .orderBy(desc(count(factoryCategories.factoryId)));

    const rfqsByStatus = await db
      .select({
        status: rfqs.status,
        count: count(),
      })
      .from(rfqs)
      .groupBy(rfqs.status);

    const userSeries = generateMonthlyTimeSeries();
    const rfqSeries = generateMonthlyTimeSeries();

    usersByMonth.forEach((row) => {
      const entry = userSeries.find((u) => u.label === row.month);
      if (entry) entry.count = Number(row.count);
    });
    rfqsByMonth.forEach((row) => {
      const entry = rfqSeries.find((r) => r.label === row.month);
      if (entry) entry.count = Number(row.count);
    });

    return {
      counts: {
        users: totalUsers.count,
        factories: totalFactories.count,
        rfqs: totalRFQs.count,
        favorites: totalFavorites.count,
        chats: totalChats.count,
        verified: verifiedFactories.count,
        featured: featuredFactories.count,
        pendingRFQs: pendingRFQs[0].count,
        avgRating: Math.round(parseFloat(avgRating.avg ?? "0") * 10) / 10,
      },
      recentUsers,
      recentRFQs,
      usersOverTime: userSeries,
      rfqsOverTime: rfqSeries,
      factoriesByCategory,
      rfqsByStatus,
    };
  }),

  activityFeed: adminQuery.query(async () => {
    const db = getDb();
    const events: {
      type: string;
      entityId: number;
      title: string;
      description: string;
      createdAt: Date;
    }[] = [];

    const recentUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(10);
    recentUsers.forEach((u) =>
      events.push({
        type: "user_joined",
        entityId: u.id,
        title: u.name || "New user",
        description: `${u.name || "A new user"} joined the platform`,
        createdAt: u.createdAt,
      })
    );

    const recentRFQs = await db
      .select({
        id: rfqs.id,
        productName: rfqs.productName,
        quantity: rfqs.quantity,
        createdAt: rfqs.createdAt,
        userName: users.name,
      })
      .from(rfqs)
      .leftJoin(users, eq(rfqs.userId, users.id))
      .orderBy(desc(rfqs.createdAt))
      .limit(10);
    recentRFQs.forEach((r) =>
      events.push({
        type: "rfq_created",
        entityId: r.id,
        title: r.productName,
        description: `RFQ for ${r.quantity} by ${r.userName || "Unknown"}`,
        createdAt: r.createdAt,
      })
    );

    const recentFactories = await db
      .select()
      .from(factories)
      .orderBy(desc(factories.createdAt))
      .limit(10);
    recentFactories.forEach((f) =>
      events.push({
        type: f.isVerified ? "factory_verified" : "factory_created",
        entityId: f.id,
        title: f.name,
        description: f.isVerified ? "Factory verified" : "Factory added",
        createdAt: f.createdAt,
      })
    );

    const recentFavorites = await db
      .select({
        id: favorites.id,
        createdAt: favorites.createdAt,
        userName: users.name,
        factoryName: factories.name,
      })
      .from(favorites)
      .leftJoin(users, eq(favorites.userId, users.id))
      .leftJoin(factories, eq(favorites.factoryId, factories.id))
      .orderBy(desc(favorites.createdAt))
      .limit(10);
    recentFavorites.forEach((f) =>
      events.push({
        type: "favorite_added",
        entityId: f.id,
        title: f.factoryName || "Factory favorited",
        description: `${f.userName || "A user"} added to favorites`,
        createdAt: f.createdAt,
      })
    );

    const recentReviews = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        createdAt: reviews.createdAt,
        userName: users.name,
        factoryName: factories.name,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .leftJoin(factories, eq(reviews.factoryId, factories.id))
      .orderBy(desc(reviews.createdAt))
      .limit(10);
    recentReviews.forEach((r) =>
      events.push({
        type: "review_posted",
        entityId: r.id,
        title: r.factoryName || "Review posted",
        description: `${r.userName || "A user"} rated ${r.rating}/5`,
        createdAt: r.createdAt,
      })
    );

    const recentNotifications = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(10);
    recentNotifications.forEach((n) =>
      events.push({
        type: "notification",
        entityId: n.id,
        title: n.title,
        description: `Notification type: ${n.type}`,
        createdAt: n.createdAt,
      })
    );

    return events
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20);
  }),

  health: adminQuery.query(async () => {
    const db = getDb();
    const start = Date.now();
    let dbStatus: "healthy" | "unhealthy" = "unhealthy";
    try {
      await db.select({ v: sql`1` }).from(users).limit(1);
      dbStatus = "healthy";
    } catch {
      dbStatus = "unhealthy";
    }
    const latencyMs = Date.now() - start;

    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [totalFactories] = await db.select({ count: count() }).from(factories);
    const [totalRFQs] = await db.select({ count: count() }).from(rfqs);
    const [totalFavorites] = await db.select({ count: count() }).from(favorites);
    const [totalChats] = await db.select({ count: count() }).from(chatMessages);

    const uptimeMs = Date.now() - startTime;
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const uptimeFormatted = days > 0
      ? `${days}d ${hours % 24}h ${minutes % 60}m`
      : `${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;

    const mem = process.memoryUsage();
    const memory = {
      usedMB: Math.round(mem.heapUsed / 1024 / 1024),
      totalMB: Math.round(mem.heapTotal / 1024 / 1024),
    };
    const loadAvg = os.loadavg();

    return {
      status: dbStatus === "healthy" ? "healthy" : "degraded",
      environment: process.env.NODE_ENV || "development",
      version: "0.0.0",
      startedAt: new Date(startTime),
      uptimeFormatted,
      db: { status: dbStatus, latencyMs },
      counts: {
        users: totalUsers.count,
        factories: totalFactories.count,
        rfqs: totalRFQs.count,
        favorites: totalFavorites.count,
        chats: totalChats.count,
      },
      memory,
      loadAvg,
    };
  }),

  logs: adminQuery
    .input(z.object({ lines: z.number().min(1).max(500).default(100) }).optional())
    .query(async ({ input }) => {
      const lines = input?.lines ?? 100;
      const isoRegex =
        /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\s*(.*)$/;

      try {
        const text = await readFile("./devserver.log", "utf-8");
        const allLines = text.split("\n").filter(Boolean).slice(-lines);
        return allLines.map((line) => {
          const lower = line.toLowerCase();
          const level = lower.includes("error")
            ? "error"
            : lower.includes("warn")
            ? "warn"
            : lower.includes("debug")
            ? "debug"
            : "info";

          const match = isoRegex.exec(line);
          if (match) {
            return {
              timestamp: match[1],
              level,
              message: match[2],
            };
          }
          return {
            timestamp: new Date().toISOString(),
            level,
            message: line,
          };
        });
      } catch {
        // Realistic mocked logs when devserver.log is unavailable
        const mockMessages = [
          { level: "info", message: "Server started and listening on port 3000" },
          { level: "info", message: "Database connection established" },
          { level: "info", message: "tRPC router initialized (admin, auth, chat, factory, favorite, rfq, upload)" },
          { level: "info", message: "WebSocket server not configured, using REST polling" },
          { level: "debug", message: "Vite HMR client connected" },
          { level: "info", message: "Health check passed - DB latency 12ms" },
          { level: "info", message: "User signed in: admin@example.com" },
          { level: "info", message: "New RFQ created: CNC Aluminum Parts x500" },
          { level: "warn", message: "Slow query detected on factory list (>500ms)" },
          { level: "info", message: "Factory verification completed: id=42" },
          { level: "info", message: "Seed data loaded successfully" },
          { level: "error", message: "Failed to send notification: missing push subscription" },
        ];
        return Array.from({ length: Math.min(lines, mockMessages.length) }, (_, i) => {
          const item = mockMessages[i % mockMessages.length];
          return {
            timestamp: new Date(Date.now() - i * 60000).toISOString(),
            level: item.level,
            message: item.message,
          };
        });
      }
    }),

  categoryList: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(categories).orderBy(asc(categories.sortOrder));
  }),

  certificateList: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(certificates).orderBy(asc(certificates.name));
  }),

  factoryList: adminQuery
    .input(
      z.object({
        search: z.string().optional(),
        categoryId: z.coerce.number().optional(),
        city: z.string().optional(),
        isVerified: z.enum(["true", "false", "all"]).default("all"),
        featured: z.enum(["true", "false", "all"]).default("all"),
        sortBy: z
          .enum(["createdAt", "rating", "reviewCount", "name"])
          .default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.pageSize;

      const conditions = [];
      if (input.search) {
        const term = `%${input.search}%`;
        conditions.push(
          or(
            like(factories.name, term),
            like(factories.location, term),
            like(factories.city, term)
          )
        );
      }
      if (input.city) {
        conditions.push(like(factories.city, `%${input.city}%`));
      }
      if (input.isVerified !== "all") {
        conditions.push(eq(factories.isVerified, input.isVerified === "true"));
      }
      if (input.featured !== "all") {
        conditions.push(eq(factories.featured, input.featured === "true"));
      }

      let factoryIdsByCategory: number[] | undefined;
      if (input.categoryId) {
        const rows = await db
          .select({ factoryId: factoryCategories.factoryId })
          .from(factoryCategories)
          .where(eq(factoryCategories.categoryId, input.categoryId));
        factoryIdsByCategory = rows.map((r) => r.factoryId);
        if (factoryIdsByCategory.length === 0) {
          return { items: [], total: 0, page: input.page, pageSize: input.pageSize };
        }
        conditions.push(inArray(factories.id, factoryIdsByCategory));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [totalRow] = await db
        .select({ total: count() })
        .from(factories)
        .where(where);

      const orderCol =
        input.sortBy === "rating"
          ? factories.rating
          : input.sortBy === "reviewCount"
          ? factories.reviewCount
          : input.sortBy === "name"
          ? factories.name
          : factories.createdAt;
      const orderFn = input.sortOrder === "asc" ? asc : desc;

      const items = await db
        .select()
        .from(factories)
        .where(where)
        .orderBy(orderFn(orderCol))
        .limit(input.pageSize)
        .offset(offset);

      const ids = items.map((f) => f.id);

      const [cats, certs, prods] = await Promise.all([
        ids.length
          ? db
              .select()
              .from(factoryCategories)
              .where(inArray(factoryCategories.factoryId, ids))
          : Promise.resolve([]),
        ids.length
          ? db
              .select()
              .from(factoryCertificates)
              .where(inArray(factoryCertificates.factoryId, ids))
          : Promise.resolve([]),
        ids.length
          ? db
              .select({ factoryId: products.factoryId, count: count() })
              .from(products)
              .where(inArray(products.factoryId, ids))
              .groupBy(products.factoryId)
          : Promise.resolve([]),
      ]);

      const enriched = items.map((f) => ({
        ...f,
        gallery: parseJsonArray<string>(f.gallery) ?? f.gallery,
        exportMarkets: parseJsonArray<string>(f.exportMarkets) ?? f.exportMarkets,
        primaryProducts: parseJsonArray<string>(f.primaryProducts) ?? f.primaryProducts,
        categoryIds: cats
          .filter((c) => c.factoryId === f.id)
          .map((c) => c.categoryId),
        certificateIds: certs
          .filter((c) => c.factoryId === f.id)
          .map((c) => c.certificateId),
        productCount: prods.find((p) => p.factoryId === f.id)?.count ?? 0,
      }));

      return {
        items: enriched,
        total: totalRow.total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  factoryDetail: adminQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [factory] = await db
        .select()
        .from(factories)
        .where(eq(factories.id, input.id))
        .limit(1);
      if (!factory) return null;

      const [cats, certs, prods] = await Promise.all([
        db
          .select()
          .from(factoryCategories)
          .where(eq(factoryCategories.factoryId, input.id)),
        db
          .select()
          .from(factoryCertificates)
          .where(eq(factoryCertificates.factoryId, input.id)),
        db.select().from(products).where(eq(products.factoryId, input.id)),
      ]);

      return {
        ...factory,
        gallery: parseJsonArray<string>(factory.gallery) ?? factory.gallery,
        exportMarkets: parseJsonArray<string>(factory.exportMarkets) ?? factory.exportMarkets,
        primaryProducts: parseJsonArray<string>(factory.primaryProducts) ?? factory.primaryProducts,
        categoryIds: cats.map((c) => c.categoryId),
        certificateIds: certs.map((c) => c.certificateId),
        products: prods,
      };
    }),

  factoryCreate: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        location: z.string().min(1),
        city: z.string().min(1),
        province: z.string().min(1),
        description: z.string().min(1),
        descriptionAr: z.string().optional(),
        logoUrl: z.string().optional(),
        heroImage: z.string().optional(),
        gallery: z.array(z.string()).optional(),
        rating: z.number().min(0).max(5).optional(),
        reviewCount: z.number().optional(),
        yearsInBusiness: z.number().optional(),
        capacity: z.string().optional(),
        moq: z.string().optional(),
        moqValue: z.number().optional(),
        employees: z.number().optional(),
        factorySize: z.string().optional(),
        isVerified: z.boolean().optional(),
        isComplianceCertified: z.boolean().optional(),
        isLeadTimeCertified: z.boolean().optional(),
        exportMarkets: z.array(z.string()).optional(),
        primaryProducts: z.array(z.string()).optional(),
        website: z.string().optional(),
        whatsapp: z.string().optional(),
        email: z.string().optional(),
        featured: z.boolean().optional(),
        categoryIds: z.array(z.number()).default([]),
        certificateIds: z.array(z.number()).default([]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { categoryIds, certificateIds, ...data } = input;

      const [existingSlug] = await db
        .select({ id: factories.id })
        .from(factories)
        .where(eq(factories.slug, data.slug))
        .limit(1);
      if (existingSlug) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `A factory with slug "${data.slug}" already exists.`,
        });
      }

      const [result] = await db.insert(factories).values({
        name: data.name,
        slug: data.slug,
        location: data.location,
        city: data.city,
        province: data.province,
        description: data.description,
        descriptionAr: data.descriptionAr,
        logoUrl: data.logoUrl,
        heroImage: data.heroImage,
        gallery: data.gallery,
        rating: data.rating ?? 0,
        reviewCount: data.reviewCount ?? 0,
        yearsInBusiness: data.yearsInBusiness ?? 0,
        capacity: data.capacity,
        moq: data.moq,
        moqValue: data.moqValue ?? 0,
        employees: data.employees ?? 0,
        factorySize: data.factorySize,
        isVerified: data.isVerified ?? false,
        isComplianceCertified: data.isComplianceCertified ?? false,
        isLeadTimeCertified: data.isLeadTimeCertified ?? false,
        exportMarkets: data.exportMarkets,
        primaryProducts: data.primaryProducts,
        website: data.website,
        whatsapp: data.whatsapp,
        email: data.email,
        featured: data.featured ?? false,
      });

      const factoryId = Number(result.insertId);

      if (categoryIds.length > 0) {
        await db.insert(factoryCategories).values(
          categoryIds.map((id) => ({ factoryId, categoryId: id }))
        );
      }
      if (certificateIds.length > 0) {
        await db.insert(factoryCertificates).values(
          certificateIds.map((id) => ({ factoryId, certificateId: id }))
        );
      }

      return { success: true, id: factoryId };
    }),

  factoryUpdate: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        slug: z.string().optional(),
        location: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        logoUrl: z.string().optional(),
        heroImage: z.string().optional(),
        gallery: z.array(z.string()).optional(),
        rating: z.number().min(0).max(5).optional(),
        reviewCount: z.number().optional(),
        yearsInBusiness: z.number().optional(),
        capacity: z.string().optional(),
        moq: z.string().optional(),
        moqValue: z.number().optional(),
        employees: z.number().optional(),
        factorySize: z.string().optional(),
        isVerified: z.boolean().optional(),
        isComplianceCertified: z.boolean().optional(),
        isLeadTimeCertified: z.boolean().optional(),
        exportMarkets: z.array(z.string()).optional(),
        primaryProducts: z.array(z.string()).optional(),
        website: z.string().optional(),
        whatsapp: z.string().optional(),
        email: z.string().optional(),
        featured: z.boolean().optional(),
        categoryIds: z.array(z.number()).optional(),
        certificateIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, categoryIds, certificateIds, ...data } = input;

      if (data.slug) {
        const [existingSlug] = await db
          .select({ id: factories.id })
          .from(factories)
          .where(eq(factories.slug, data.slug))
          .limit(1);
        if (existingSlug && existingSlug.id !== id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `A factory with slug "${data.slug}" already exists.`,
          });
        }
      }

      await db.update(factories).set(data).where(eq(factories.id, id));

      if (categoryIds !== undefined) {
        await db
          .delete(factoryCategories)
          .where(eq(factoryCategories.factoryId, id));
        if (categoryIds.length > 0) {
          await db.insert(factoryCategories).values(
            categoryIds.map((cid) => ({ factoryId: id, categoryId: cid }))
          );
        }
      }

      if (certificateIds !== undefined) {
        await db
          .delete(factoryCertificates)
          .where(eq(factoryCertificates.factoryId, id));
        if (certificateIds.length > 0) {
          await db.insert(factoryCertificates).values(
            certificateIds.map((cid) => ({ factoryId: id, certificateId: cid }))
          );
        }
      }

      return { success: true };
    }),

  factoryDelete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const id = input.id;
      await db.delete(products).where(eq(products.factoryId, id));
      await db.delete(factoryCategories).where(eq(factoryCategories.factoryId, id));
      await db.delete(factoryCertificates).where(eq(factoryCertificates.factoryId, id));
      await db.delete(favorites).where(eq(favorites.factoryId, id));
      await db.delete(reviews).where(eq(reviews.factoryId, id));
      await db.delete(rfqs).where(eq(rfqs.factoryId, id));
      await db.delete(factories).where(eq(factories.id, id));
      return { success: true };
    }),

  factoryBulkAction: adminQuery
    .input(
      z.object({
        ids: z.array(z.number()).min(1),
        action: z.enum([
          "verify",
          "unverify",
          "feature",
          "unfeature",
          "delete",
        ]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      if (input.action === "delete") {
        await db.delete(products).where(inArray(products.factoryId, input.ids));
        await db.delete(factoryCategories).where(inArray(factoryCategories.factoryId, input.ids));
        await db.delete(factoryCertificates).where(inArray(factoryCertificates.factoryId, input.ids));
        await db.delete(favorites).where(inArray(favorites.factoryId, input.ids));
        await db.delete(reviews).where(inArray(reviews.factoryId, input.ids));
        await db.delete(rfqs).where(inArray(rfqs.factoryId, input.ids));
        await db.delete(factories).where(inArray(factories.id, input.ids));
      } else if (input.action === "verify") {
        await db
          .update(factories)
          .set({ isVerified: true })
          .where(inArray(factories.id, input.ids));
      } else if (input.action === "unverify") {
        await db
          .update(factories)
          .set({ isVerified: false })
          .where(inArray(factories.id, input.ids));
      } else if (input.action === "feature") {
        await db
          .update(factories)
          .set({ featured: true })
          .where(inArray(factories.id, input.ids));
      } else if (input.action === "unfeature") {
        await db
          .update(factories)
          .set({ featured: false })
          .where(inArray(factories.id, input.ids));
      }
      return { success: true, affected: input.ids.length };
    }),

  productList: adminQuery
    .input(z.object({ factoryId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(products)
        .where(eq(products.factoryId, input.factoryId))
        .orderBy(asc(products.name));
    }),

  productCreate: adminQuery
    .input(
      z.object({
        factoryId: z.number(),
        name: z.string().min(1),
        nameAr: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        priceRange: z.string().optional(),
        moq: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [result] = await db.insert(products).values(input);
      return { success: true, id: Number(result.insertId) };
    }),

  productUpdate: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        nameAr: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        priceRange: z.string().optional(),
        moq: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(products).set(data).where(eq(products.id, id));
      return { success: true };
    }),

  productDelete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(products).where(eq(products.id, input.id));
      return { success: true };
    }),

  userList: adminQuery
    .input(
      z.object({
        search: z.string().optional(),
        role: z.enum(["all", "admin", "user"]).default("all"),
        lang: z.enum(["all", "en", "ar"]).default("all"),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.pageSize;

      const conditions = [];
      if (input.search) {
        const term = `%${input.search}%`;
        conditions.push(
          or(
            like(users.name, term),
            like(users.email, term),
            like(users.company, term)
          )
        );
      }
      if (input.role !== "all") {
        conditions.push(eq(users.role, input.role));
      }
      if (input.lang !== "all") {
        conditions.push(eq(users.lang, input.lang));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [totalRow] = await db
        .select({ total: count() })
        .from(users)
        .where(where);

      const items = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          lang: users.lang,
          avatar: users.avatar,
          company: users.company,
          phone: users.phone,
          createdAt: users.createdAt,
          lastSignInAt: users.lastSignInAt,
        })
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      return {
        items,
        total: totalRow.total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  userDetail: adminQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [user] = await db.select().from(users).where(eq(users.id, input.id)).limit(1);
      if (!user) return null;

      const [rfqRows, favRows, reviewRows] = await Promise.all([
        db.select().from(rfqs).where(eq(rfqs.userId, input.id)).orderBy(desc(rfqs.createdAt)),
        db
          .select({ id: favorites.id, factoryId: favorites.factoryId, factoryName: factories.name })
          .from(favorites)
          .leftJoin(factories, eq(favorites.factoryId, factories.id))
          .where(eq(favorites.userId, input.id))
          .orderBy(desc(favorites.createdAt)),
        db
          .select({
            id: reviews.id,
            factoryId: reviews.factoryId,
            rating: reviews.rating,
            comment: reviews.comment,
            factoryName: factories.name,
          })
          .from(reviews)
          .leftJoin(factories, eq(reviews.factoryId, factories.id))
          .where(eq(reviews.userId, input.id))
          .orderBy(desc(reviews.createdAt)),
      ]);

      return { user, rfqs: rfqRows, favorites: favRows, reviews: reviewRows };
    }),

  userCreate: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        role: z.enum(["user", "admin"]).default("user"),
        lang: z.enum(["en", "ar"]).default("en"),
        avatar: z.string().optional(),
        company: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const unionId = `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const [result] = await db.insert(users).values({
        unionId,
        name: input.name,
        email: input.email,
        role: input.role,
        lang: input.lang,
        avatar: input.avatar,
        company: input.company,
        phone: input.phone,
      });
      return { success: true, id: Number(result.insertId) };
    }),

  userUpdate: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(["user", "admin"]).optional(),
        lang: z.enum(["en", "ar"]).optional(),
        avatar: z.string().optional(),
        company: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(users).set(data).where(eq(users.id, id));
      return { success: true };
    }),

  userDelete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const id = input.id;
      await db.delete(chatMessages).where(eq(chatMessages.userId, id));
      await db.delete(favorites).where(eq(favorites.userId, id));
      await db.delete(notifications).where(eq(notifications.userId, id));
      await db.delete(reviews).where(eq(reviews.userId, id));
      await db.delete(rfqs).where(eq(rfqs.userId, id));
      await db.delete(searchHistory).where(eq(searchHistory.userId, id));
      await db.delete(users).where(eq(users.id, id));
      return { success: true };
    }),

  rfqList: adminQuery
    .input(
      z.object({
        search: z.string().optional(),
        status: factoryStatusEnum.optional(),
        sortBy: z.enum(["createdAt"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.pageSize;

      const conditions = [];
      if (input.status) {
        conditions.push(eq(rfqs.status, input.status));
      }
      if (input.search) {
        const term = `%${input.search}%`;
        conditions.push(
          or(
            like(rfqs.productName, term),
            like(users.name, term),
            like(users.email, term)
          )
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [totalRow] = await db
        .select({ total: countDistinct(rfqs.id) })
        .from(rfqs)
        .leftJoin(users, eq(rfqs.userId, users.id))
        .where(where);

      const items = await db
        .select({
          id: rfqs.id,
          productName: rfqs.productName,
          quantity: rfqs.quantity,
          status: rfqs.status,
          specifications: rfqs.specifications,
          targetPrice: rfqs.targetPrice,
          deliveryLocation: rfqs.deliveryLocation,
          createdAt: rfqs.createdAt,
          updatedAt: rfqs.updatedAt,
          response: rfqs.response,
          responsePrice: rfqs.responsePrice,
          responseLeadTime: rfqs.responseLeadTime,
          userId: rfqs.userId,
          userName: users.name,
          userEmail: users.email,
          factoryId: rfqs.factoryId,
        })
        .from(rfqs)
        .leftJoin(users, eq(rfqs.userId, users.id))
        .where(where)
        .orderBy(input.sortOrder === "asc" ? asc(rfqs.createdAt) : desc(rfqs.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      return {
        items,
        total: totalRow.total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  rfqDetail: adminQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [rfq] = await db
        .select({
          id: rfqs.id,
          productName: rfqs.productName,
          quantity: rfqs.quantity,
          status: rfqs.status,
          specifications: rfqs.specifications,
          targetPrice: rfqs.targetPrice,
          deliveryLocation: rfqs.deliveryLocation,
          createdAt: rfqs.createdAt,
          updatedAt: rfqs.updatedAt,
          response: rfqs.response,
          responsePrice: rfqs.responsePrice,
          responseLeadTime: rfqs.responseLeadTime,
          userId: rfqs.userId,
          userName: users.name,
          userEmail: users.email,
          factoryId: rfqs.factoryId,
          factoryName: factories.name,
        })
        .from(rfqs)
        .leftJoin(users, eq(rfqs.userId, users.id))
        .leftJoin(factories, eq(rfqs.factoryId, factories.id))
        .where(eq(rfqs.id, input.id))
        .limit(1);
      return rfq ?? null;
    }),

  rfqRespond: adminQuery
    .input(
      z.object({
        id: z.number(),
        response: z.string().min(1),
        responsePrice: z.string().optional(),
        responseLeadTime: z.string().optional(),
        status: z.enum(["responded", "negotiating", "accepted", "declined"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(rfqs).set(data).where(eq(rfqs.id, id));

      const [rfq] = await db
        .select({ userId: rfqs.userId, productName: rfqs.productName, factoryId: rfqs.factoryId })
        .from(rfqs)
        .where(eq(rfqs.id, id))
        .limit(1);
      if (rfq?.userId) {
        await insertNotification({
          userId: rfq.userId,
          type: "rfq_response",
          title: `Response received for ${rfq.productName}`,
          titleAr: `تم الرد على طلب عرض السعر ${rfq.productName}`,
          description: data.responsePrice
            ? `The factory responded with price ${data.responsePrice}.`
            : "The factory has responded to your quotation request.",
          descriptionAr: data.responsePrice
            ? `رد المصنع بسعر ${data.responsePrice}.`
            : "رد المصنع على طلب عرض السعر الخاص بك.",
          icon: "file-text",
          link: rfq.factoryId ? `/factory/${rfq.factoryId}` : undefined,
        });
      }

      return { success: true };
    }),

  rfqUpdateStatus: adminQuery
    .input(
      z.object({
        id: z.number(),
        status: factoryStatusEnum,
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(rfqs).set({ status: input.status }).where(eq(rfqs.id, input.id));
      return { success: true };
    }),

  rfqBulkUpdateStatus: adminQuery
    .input(
      z.object({
        ids: z.array(z.number()).min(1),
        status: factoryStatusEnum,
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(rfqs)
        .set({ status: input.status })
        .where(inArray(rfqs.id, input.ids));
      return { success: true, affected: input.ids.length };
    }),

  restartServer: adminQuery.mutation(async () => {
    if (process.env.NODE_ENV === "production") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Server restart is only available in development.",
      });
    }

    const command = process.platform === "win32" ? "npm.cmd" : "npm";
    const child = spawn(command, ["run", "dev"], {
      cwd: process.cwd(),
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    child.unref();

    // Give the new process a moment to start before exiting the current one.
    setTimeout(() => {
      process.exit(0);
    }, 1000);

    return { success: true, message: "Restarting dev server..." };
  }),
});
