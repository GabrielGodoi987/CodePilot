import { randomUUID } from "node:crypto";
import { Aggregate } from "../../../../shared/domain-events/aggregate-base.interface";
import { DomainEvent } from "../../../../shared/domain-events/domain-event.interface";
import { CompanyMemberAdded } from "../../company-member/aggregate/company-member.aggregate";
import { CompanyCreated } from "../domain/events/company.events";

export class CompanyAggregate extends Aggregate {
  private id: string;
  private name: string;

  private constructor(name: string) {
    super();
    this.id = randomUUID();
    this.name = name;
  }

  static create(
    name: string,
    founderUserId: string,
    founderRole: string,
  ): CompanyAggregate {
    if (!name || name.trim().length === 0) {
      throw new Error("Company name is required");
    }

    const company = new CompanyAggregate(name);

    company.createEvent(new CompanyCreated(company.getId(), name));
    company.createEvent(
      new CompanyMemberAdded(
        randomUUID(),
        founderUserId,
        company.getId(),
        founderRole,
      ),
    );

    return company;
  }

  createEvent(event: DomainEvent): void {
    this.events.push(event);
  }

  getId(): string {
    return this.id;
  }

  setid(id: string) {
    this.id = id;
  }

  getName(): string {
    return this.name;
  }

  setName(name: string) {
    this.name = name;
  }
}
