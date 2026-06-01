import { DomainEvent } from "../../../shared/domain-events/domain-event.interface";
import { EventBus } from "../../../shared/domain-events/event-bus.interface";
import { EventHandler } from "../../../shared/domain-events/event-handler.interface";

export class NotificationHandler implements EventHandler {
  private eventBus: EventBus;
  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;

    //this.eventBus.subscribe("Company.Created");
  }
  async handle(event: DomainEvent): Promise<void> {}
}
