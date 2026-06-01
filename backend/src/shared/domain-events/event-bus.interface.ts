import { DomainEvent } from "./domain-event.interface";
import { EventHandler } from "./event-handler.interface";

export interface EventBus {
  subscribe(eventName: string, eventHandler: EventHandler): Promise<void>;
  publish(event: DomainEvent): Promise<void>;
  start(): Promise<void>;
  reconstructEvent(eventData: any): DomainEvent;
  close(): Promise<void>;
}
