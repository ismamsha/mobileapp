import { getDb } from "./connection";
import { notifications } from "@db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import type { Notification } from "@db/schema";

export async function getUserNotifications(userId: number, type?: string) {
  const db = getDb();
  
  if (type && type !== "all") {
    return db.select().from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.type, type as Notification["type"])))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }
  
  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function markNotificationRead(notificationId: number, userId: number) {
  const db = getDb();
  await db.update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number) {
  const db = getDb();
  await db.update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
}

export async function createNotification(data: {
  userId: number;
  type: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  icon?: string;
  link?: string;
}) {
  const db = getDb();
  return db.insert(notifications).values(data as typeof notifications.$inferInsert);
}

export async function getUnreadCount(userId: number) {
  const db = getDb();
  const rows = await db.select({ count: sql<number>`count(*)` }).from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return Number(rows[0]?.count ?? 0);
}
