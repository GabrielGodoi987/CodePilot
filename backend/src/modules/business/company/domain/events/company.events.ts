import { DomainEvent } from "../../../../../shared/domain-events/domain-event.interface";

export class CompanyCreated extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly name: string,
  ) {
    super("company.created", aggregateId, new Date());
  }

  getEventData() {
    return {
      aggregateId: this.aggregateId,
      name: this.name,
    };
  }
}
