import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getChatHistory, saveChatMessage, searchFactoriesForAI } from "./queries/chat";

const CATEGORY_KEYWORDS: { keywords: string[]; response: string }[] = [
  {
    keywords: ["furniture", "أثاث", "sofa", "chair", "table", "bed", "wood", "خشب"],
    response: "I found excellent furniture manufacturers for you. Here are the top matches with high ratings and competitive MOQs:",
  },
  {
    keywords: ["electronic", "إلكترون", "phone", "mobile", "earbud", "charger", "cable", "led", "smart", "usb"],
    response: "Great choice! Shenzhen has the best electronics manufacturers. Here are my top recommendations with verified certifications:",
  },
  {
    keywords: ["textile", "fabric", "منسوج", "cotton", "silk", "yarn", "قماش", "حرير"],
    response: "I found premium textile suppliers with various fabric options. Here are the best matches:",
  },
  {
    keywords: ["cosmetic", "مستحضر", "beauty", "skincare", "makeup", "perfume", "lipstick", "شامبو"],
    response: "Here are GMP-certified cosmetics manufacturers with OEM/ODM capabilities:",
  },
  {
    keywords: ["auto", "car", "سيار", "brake", "engine", "suspension", "wheel", "filter", "قطع"],
    response: "Here are precision auto parts manufacturers with IATF certification:",
  },
  {
    keywords: ["food", "beverage", "غذاء", "مشروب", "snack", "nut", "fruit", "drink"],
    response: "I found food and beverage suppliers with the certifications you need for export:",
  },
  {
    keywords: ["machinery", "machine", "آلة", "ماكين", "cnc", "injection", "packaging", "conveyor"],
    response: "Here are industrial machinery manufacturers with CE certification and global support:",
  },
  {
    keywords: ["construction", "building", "بناء", "مواد", "tile", "steel", "insulation", "ceramic"],
    response: "I found construction material suppliers experienced in large infrastructure projects:",
  },
];

function detectCategory(message: string) {
  const lower = message.toLowerCase();
  for (const cat of CATEGORY_KEYWORDS) {
    if (cat.keywords.some(kw => lower.includes(kw.toLowerCase()))) {
      return cat;
    }
  }
  return null;
}

async function processAIMessage(userId: number, message: string) {
  // Save user message
  await saveChatMessage(userId, "user", message);

  // Detect category and build search keywords
  const category = detectCategory(message);
  const searchKeywords = category ? category.keywords : [message];

  // Search for matching factories
  const matchingFactories = await searchFactoriesForAI(searchKeywords);

  const response = category
    ? category.response
    : `I understand you're looking for "${message}". Based on our database of verified Chinese manufacturers, here are the best matches:`;

  // Save AI response
  const factoryIds = matchingFactories.map(f => f.id);
  await saveChatMessage(userId, "assistant", response, factoryIds.length > 0 ? factoryIds : undefined);

  return {
    response,
    factories: matchingFactories,
  };
}

export const chatRouter = createRouter({
  history: authedQuery
    .input(z.object({ limit: z.number().min(1).max(100).optional() }).optional())
    .query(({ ctx, input }) =>
      getChatHistory(ctx.user.id, input?.limit ?? 50),
    ),

  send: authedQuery
    .input(z.object({
      message: z.string().min(1).max(2000),
    }))
    .mutation(({ ctx, input }) => processAIMessage(ctx.user.id, input.message)),
});
