import { NextFunction, Request, Response } from "express";
import { API_TOKEN } from "../constants/env-variables";

export class ApiTokenMiddleware {
  public static async verifyApiToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const apiToken = req.headers["x-api-token"];

    if (!apiToken) {
      return res.status(401).json({
        message: "Api token not provided",
        error: "Not authorized",
        status: 401,
      });
    }

    if (apiToken !== API_TOKEN) {
      return res.status(403).json({
        message: "Invalid API token",
        error: "Forbidden",
        status: 403,
      });
    }

    next();
  }
}
