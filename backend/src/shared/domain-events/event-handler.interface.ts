import type { DomainEvent } from "./domain-event.interface";

export interface EventHandler {
  handle(event: DomainEvent): Promise<void>;
}
