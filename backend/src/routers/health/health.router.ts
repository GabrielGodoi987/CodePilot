import { Router } from "express";
import { HealthCheckController } from "../../modules/health/health-check.controller";

const healthCheckRouter = Router();

healthCheckRouter.get("/check", HealthCheckController.getHealthCheck);
