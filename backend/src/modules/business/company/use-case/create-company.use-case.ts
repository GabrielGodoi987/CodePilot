import { db } from "../../../../db";
import { companyMemberSchema, companySchema } from "../../../../db/schema";
import { EventBus } from "../../../../shared/domain-events/event-bus.interface";
import { CompanyAggregate } from "../aggregate/company.aggregate";

export class CreateCompanyUseCase {
  constructor(private readonly eventBus: EventBus) {}

  async execute(input: {
    name: string;
    founderUserId: string;
    founderRole: string;
  }) {
    const company = CompanyAggregate.create(
      input.name,
      input.founderUserId,
      input.founderRole,
    );

    await db.insert(companySchema).values({
      id: company.getId(),
      name: company.getName(),
    });

    const memberEvent = company
      .getEvents()
      .find((e) => e.getEventName() === "company.member.added");

    const memberData = memberEvent?.getEventData();

    if (memberData) {
      await db.insert(companyMemberSchema).values({
        id: memberData.aggregateId as string,
        companyId: company.getId(),
        userId: input.founderUserId,
        role: input.founderRole as "RECRUITER",
      });
    }

    for (const event of company.getEvents()) {
      await this.eventBus.publish(event);
    }

    company.clearDomainEvents();

    return company;
  }
}
