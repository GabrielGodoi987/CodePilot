import { db } from "../../db";
import { BullMQEventProcessor } from "../infrastructure/event-processor/bullmq-event.processor";

export async function bootStrap() {
  await db.$client.connect();
  console.log("  Database connected successfully");

  const eventBus = new BullMQEventProcessor(
    {
      host: process.env.REDIS_HOST || "localhost",
      port: Number(process.env.REDIS_PORT) || 6979,
      password: process.env.REDIS_PASSWORD ?? "",
    },
    "domain-events",
  );

  await eventBus.start();
  console.log("  Event bus connected");

  console.log(`
  ╔══════════════════════════════════════════════════════╗
  ║                                                      ║
  ║     ██████╗ ██████╗ ██████╗ ███████╗██████╗         ║
  ║    ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔══██╗        ║
  ║    ██║     ██║   ██║██║  ██║█████╗  ██████╔╝        ║
  ║    ██║     ██║   ██║██║  ██║██╔══╝  ██╔═══╝         ║
  ║    ╚██████╗╚██████╔╝██████╔╝███████╗██║             ║
  ║     ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝             ║
  ║                                                      ║
  ║     ██████╗ ██╗██╗      ██████╗ ████████╗           ║
  ║     ██╔══██╗██║██║     ██╔═══██╗╚══██╔══╝           ║
  ║     ██████╔╝██║██║     ██║   ██║   ██║              ║
  ║     ██╔═══╝ ██║██║     ██║   ██║   ██║              ║
  ║     ██║     ██║███████╗╚██████╔╝   ██║              ║
  ║     ╚═╝     ╚═╝╚══════╝ ╚═════╝    ╚═╝              ║
  ║                                                      ║
  ╚══════════════════════════════════════════════════════╝
  ╔══════════════════════════════════════════════════════╗
  ║   Database: Connected                                ║
  ║   Redis:    Connected                                ║
  ║   Server:   http://localhost:${String(process.env.PORT || 3000).padEnd(34)}║
  ╚══════════════════════════════════════════════════════╝
  `);
}
