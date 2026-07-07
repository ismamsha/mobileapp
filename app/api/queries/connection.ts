import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema, mysql.Pool>>;

export function getDb() {
  if (!instance) {
    const pool = mysql.createPool({
      uri: env.databaseUrl,
      typeCast: (field, next) => {
        if (field.type === "JSON") {
          const raw = field.string();
          return raw ? JSON.parse(raw) : null;
        }
        return next();
      },
    });
    instance = drizzle(pool, { schema: fullSchema, mode: "default" });
  }
  return instance;
}
