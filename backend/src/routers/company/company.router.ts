import { Router } from "express";
import { CompanyController } from "../../modules/business/company/company.controller";
import { CreateCompanyUseCase } from "../../modules/business/company/use-case/create-company.use-case";

export const companyRouter = (createCompanyUseCase: CreateCompanyUseCase) => {
  const router = Router();
  const controller = new CompanyController(createCompanyUseCase);

  router.post("/companies", (req, res) => controller.create(req, res));

  return router;
};