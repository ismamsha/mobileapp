import { relations } from "drizzle-orm";
import {
  users,
  factories,
  products,
  categories,
  factoryCategories,
  certificates,
  factoryCertificates,
  favorites,
  rfqs,
  chatMessages,
  notifications,
  searchHistory,
  reviews,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  favorites: many(favorites),
  rfqs: many(rfqs),
  chatMessages: many(chatMessages),
  notifications: many(notifications),
  searchHistory: many(searchHistory),
  reviews: many(reviews),
}));

export const factoriesRelations = relations(factories, ({ many }) => ({
  products: many(products),
  factoryCategories: many(factoryCategories),
  factoryCertificates: many(factoryCertificates),
  favorites: many(favorites),
  rfqs: many(rfqs),
  reviews: many(reviews),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  factoryCategories: many(factoryCategories),
}));

export const factoryCategoriesRelations = relations(factoryCategories, ({ one }) => ({
  factory: one(factories, { fields: [factoryCategories.factoryId], references: [factories.id] }),
  category: one(categories, { fields: [factoryCategories.categoryId], references: [categories.id] }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  factory: one(factories, { fields: [products.factoryId], references: [factories.id] }),
}));

export const certificatesRelations = relations(certificates, ({ many }) => ({
  factoryCertificates: many(factoryCertificates),
}));

export const factoryCertificatesRelations = relations(factoryCertificates, ({ one }) => ({
  factory: one(factories, { fields: [factoryCertificates.factoryId], references: [factories.id] }),
  certificate: one(certificates, { fields: [factoryCertificates.certificateId], references: [certificates.id] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  factory: one(factories, { fields: [favorites.factoryId], references: [factories.id] }),
}));

export const rfqsRelations = relations(rfqs, ({ one }) => ({
  user: one(users, { fields: [rfqs.userId], references: [users.id] }),
  factory: one(factories, { fields: [rfqs.factoryId], references: [factories.id] }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, { fields: [chatMessages.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, { fields: [searchHistory.userId], references: [users.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  factory: one(factories, { fields: [reviews.factoryId], references: [factories.id] }),
}));
