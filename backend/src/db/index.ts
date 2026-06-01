import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { DATABASE_URL } from "../shared/commons/constants/env-variables";
import * as schema from "./schema";

export const db = drizzle(DATABASE_URL, { schema });

export * from "./schema";
