import {
  mysqlTable,
  mysqlEnum,
  varchar,
  text,
  timestamp,
  datetime,
  bigint,
  int,
  float,
  boolean,
  json,
  index,
} from "drizzle-orm/mysql-core";

// ── Users (OAuth) ──────────────────────────────────────────
export const users = mysqlTable("users", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  lang: mysqlEnum("lang", ["en", "ar"]).default("en").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Categories ─────────────────────────────────────────────
export const categories = mysqlTable("categories", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  nameEn: varchar("nameEn", { length: 100 }).notNull(),
  nameAr: varchar("nameAr", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;

// ── Factories ──────────────────────────────────────────────
export const factories = mysqlTable("factories", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  location: varchar("location", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  description: text("description").notNull(),
  descriptionAr: text("descriptionAr"),
  logoUrl: text("logoUrl"),
  heroImage: text("heroImage"),
  gallery: json("gallery").$type<string[]>(),
  rating: float("rating").default(0).notNull(),
  reviewCount: int("reviewCount").default(0).notNull(),
  yearsInBusiness: int("yearsInBusiness").default(0).notNull(),
  capacity: varchar("capacity", { length: 100 }),
  moq: varchar("moq", { length: 100 }),
  moqValue: int("moqValue").default(0),
  employees: int("employees").default(0),
  factorySize: varchar("factorySize", { length: 100 }),
  isVerified: boolean("isVerified").default(false).notNull(),
  isComplianceCertified: boolean("isComplianceCertified").default(false).notNull(),
  isLeadTimeCertified: boolean("isLeadTimeCertified").default(false).notNull(),
  exportMarkets: json("exportMarkets").$type<string[]>(),
  primaryProducts: json("primaryProducts").$type<string[]>(),
  website: varchar("website", { length: 255 }),
  whatsapp: varchar("whatsapp", { length: 50 }),
  email: varchar("email", { length: 320 }),
  featured: boolean("featured").default(false).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  searchCount: int("searchCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  slugIdx: index("slug_idx").on(table.slug),
  cityIdx: index("city_idx").on(table.city),
  featuredIdx: index("featured_idx").on(table.featured),
  ratingIdx: index("rating_idx").on(table.rating),
}));

export type Factory = typeof factories.$inferSelect;
export type InsertFactory = typeof factories.$inferInsert;

// ── Factory Categories (many-to-many) ──────────────────────
export const factoryCategories = mysqlTable("factory_categories", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  factoryId: bigint("factoryId", { mode: "number", unsigned: true }).notNull(),
  categoryId: bigint("categoryId", { mode: "number", unsigned: true }).notNull(),
}, (table) => ({
  fcIdx: index("fc_idx").on(table.factoryId, table.categoryId),
}));

// ── Products ───────────────────────────────────────────────
export const products = mysqlTable("products", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  factoryId: bigint("factoryId", { mode: "number", unsigned: true }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  description: text("description"),
  imageUrl: text("imageUrl"),
  priceRange: varchar("priceRange", { length: 100 }),
  moq: varchar("moq", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  factoryIdx: index("product_factory_idx").on(table.factoryId),
}));

export type Product = typeof products.$inferSelect;

// ── Certificates ───────────────────────────────────────────
export const certificates = mysqlTable("certificates", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ── Factory Certificates (many-to-many) ────────────────────
export const factoryCertificates = mysqlTable("factory_certificates", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  factoryId: bigint("factoryId", { mode: "number", unsigned: true }).notNull(),
  certificateId: bigint("certificateId", { mode: "number", unsigned: true }).notNull(),
  documentUrl: text("documentUrl"),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  expiresAt: datetime("expiresAt"),
}, (table) => ({
  fcertIdx: index("fcert_idx").on(table.factoryId, table.certificateId),
}));

// ── Favorites ──────────────────────────────────────────────
export const favorites = mysqlTable("favorites", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  factoryId: bigint("factoryId", { mode: "number", unsigned: true }).notNull(),
  collectionName: varchar("collectionName", { length: 100 }).default("Default").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("fav_user_idx").on(table.userId),
  factoryIdx: index("fav_factory_idx").on(table.factoryId),
  uniqueFav: index("unique_fav_idx").on(table.userId, table.factoryId),
}));

export type Favorite = typeof favorites.$inferSelect;

// ── RFQs (Request for Quotations) ──────────────────────────
export const rfqs = mysqlTable("rfqs", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  factoryId: bigint("factoryId", { mode: "number", unsigned: true }),
  productName: varchar("productName", { length: 255 }).notNull(),
  quantity: varchar("quantity", { length: 100 }).notNull(),
  specifications: text("specifications"),
  targetPrice: varchar("targetPrice", { length: 100 }),
  deliveryLocation: varchar("deliveryLocation", { length: 255 }),
  status: mysqlEnum("status", ["pending", "sent", "responded", "negotiating", "accepted", "declined"]).default("pending").notNull(),
  response: text("response"),
  responsePrice: varchar("responsePrice", { length: 100 }),
  responseLeadTime: varchar("responseLeadTime", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userIdx: index("rfq_user_idx").on(table.userId),
  statusIdx: index("rfq_status_idx").on(table.status),
}));

export type RFQ = typeof rfqs.$inferSelect;

// ── Chat Messages (AI Chat History) ────────────────────────
export const chatMessages = mysqlTable("chat_messages", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  factoriesSuggested: json("factoriesSuggested").$type<number[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("chat_user_idx").on(table.userId),
  createdIdx: index("chat_created_idx").on(table.createdAt),
}));

export type ChatMessage = typeof chatMessages.$inferSelect;

// ── Notifications ──────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  type: mysqlEnum("type", ["message", "update", "recommendation", "rfq_response", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }),
  description: text("description").notNull(),
  descriptionAr: text("descriptionAr"),
  icon: varchar("icon", { length: 50 }),
  link: varchar("link", { length: 255 }),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("notif_user_idx").on(table.userId),
  readIdx: index("notif_read_idx").on(table.isRead),
}));

export type Notification = typeof notifications.$inferSelect;

// ── Search History ─────────────────────────────────────────
export const searchHistory = mysqlTable("search_history", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }),
  query: varchar("query", { length: 255 }).notNull(),
  filters: json("filters").$type<Record<string, unknown>>(),
  resultCount: int("resultCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("sh_user_idx").on(table.userId),
}));

// ── Reviews ────────────────────────────────────────────────
export const reviews = mysqlTable("reviews", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  factoryId: bigint("factoryId", { mode: "number", unsigned: true }).notNull(),
  rating: int("rating").notNull(),
  comment: text("comment"),
  verifiedPurchase: boolean("verifiedPurchase").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  factoryIdx: index("review_factory_idx").on(table.factoryId),
}));

export type Review = typeof reviews.$inferSelect;
