import { Aggregate } from "../../../../shared/domain-events/aggregate-base.interface";
import { DomainEvent } from "../../../../shared/domain-events/domain-event.interface";

export class CompanyMemberAdded extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly userId: string,
    public readonly companyId: string,
    public readonly role: string,
  ) {
    super("company.member.added", aggregateId, new Date());
  }

  getEventData() {
    return {
      aggregateId: this.aggregateId,
      userId: this.userId,
      companyId: this.companyId,
      role: this.role,
    };
  }
}

export class CompanyMemberAggregate extends Aggregate {
  private _id!: string;
  private _role!: string;

  private constructor() {
    super();
  }

  static create(userId: string, companyId: string, role: string): CompanyMemberAggregate {
    const member = new CompanyMemberAggregate();
    member._id = crypto.randomUUID();
    member._role = role;

    member.createEvent(new CompanyMemberAdded(member._id, userId, companyId, role));

    return member;
  }

  createEvent(event: DomainEvent): void {
    this.events.push(event);
  }
}
