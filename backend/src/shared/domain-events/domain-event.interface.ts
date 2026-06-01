export abstract class DomainEvent {
  readonly eventName: string;
  readonly aggregateId: string;
  readonly occurriedAt: Date;

  constructor(eventName: string, aggregateId: string, occurriedAt: Date) {
    this.eventName = eventName;
    this.aggregateId = aggregateId;
    this.occurriedAt = occurriedAt;
  }

  abstract getEventData(): Record<string, unknown>;

  getEventName(): string {
    return this.eventName;
  }

  getAggregateId(): string {
    return this.aggregateId;
  }

  getOccurriedAt(): Date {
    return this.occurriedAt;
  }
}
