import express from "express";
import { ApiTokenMiddleware } from "./shared/commons/middleware/api-token.middleware";
import { bootStrap } from "./shared/express-setup/server";

export const app = express();

// middlewares setup
app.use(ApiTokenMiddleware.verifyApiToken);

bootStrap().catch((error) => {
  console.error("Failed to start the server: ", error);
  process.exit(1);
});
