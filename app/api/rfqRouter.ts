import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { rfqs } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const rfqRouter = createRouter({
  myList: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(rfqs)
      .where(eq(rfqs.userId, ctx.user.id))
      .orderBy(desc(rfqs.createdAt));
  }),

  create: authedQuery
    .input(z.object({
      factoryId: z.number().optional(),
      productName: z.string().min(1),
      quantity: z.string().min(1),
      specifications: z.string().optional(),
      targetPrice: z.string().optional(),
      deliveryLocation: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(rfqs).values({
        userId: ctx.user.id,
        factoryId: input.factoryId ?? null,
        productName: input.productName,
        quantity: input.quantity,
        specifications: input.specifications ?? null,
        targetPrice: input.targetPrice ?? null,
        deliveryLocation: input.deliveryLocation ?? null,
        status: "pending",
      });
      const rfqId = Number(result[0].insertId);
      return { success: true, id: rfqId };
    }),
});
