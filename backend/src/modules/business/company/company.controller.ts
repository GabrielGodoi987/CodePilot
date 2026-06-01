import { Request, Response } from "express";
import { CreateCompanyUseCase } from "./use-case/create-company.use-case";

export class CompanyController {
  constructor(private readonly createCompanyUseCase: CreateCompanyUseCase) {}

  async create(req: Request, res: Response) {
    const { name, founderUserId, founderRole } = req.body;

    const company = await this.createCompanyUseCase.execute({
      name,
      founderUserId,
      founderRole,
    });

    res.status(201).json({ id: company.getId(), name: company.getName() });
  }
}
