import { DomainEvent } from "./domain-event.interface";

export abstract class Aggregate {
  protected events: DomainEvent[];

  constructor() {
    this.events = [];
  }

  abstract createEvent(event: DomainEvent): void;

  getEvents(): DomainEvent[] {
    return this.events;
  }

  clearDomainEvents(): void {
    this.events = [];
  }
}
