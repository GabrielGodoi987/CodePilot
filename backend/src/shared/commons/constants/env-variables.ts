import { config } from "dotenv";

config({
  debug: true,
});

export const PORT = process.env.PORT!;
export const API_TOKEN = process.env.API_TOKEN!;
export const JWT_SECRET = process.env.JWT_SECRET!;
export const DATABASE_URL = process.env.DATABASE_URL!;
