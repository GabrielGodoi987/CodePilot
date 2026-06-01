import { Queue, Worker, Job } from "bullmq";
import { DomainEvent } from "../../domain-events/domain-event.interface";
import { EventBus } from "../../domain-events/event-bus.interface";
import { EventHandler } from "../../domain-events/event-handler.interface";

type RedisConnection = {
  host: string;
  port: number;
  password?: string;
};

export class BullMQEventProcessor implements EventBus {
  private readonly queue: Queue;
  private readonly handlers = new Map<string, EventHandler[]>();
  private worker: Worker | null = null;

  constructor(
    private readonly connection: RedisConnection,
    private readonly queueName: string = "domain-events",
  ) {
    this.queue = new Queue(queueName, { connection });
  }

  async subscribe(eventName: string, eventHandler: EventHandler): Promise<void> {
    const handlers = this.handlers.get(eventName) ?? [];
    handlers.push(eventHandler);
    this.handlers.set(eventName, handlers);
  }

  async publish(event: DomainEvent): Promise<void> {
    await this.queue.add(event.eventName, {
      eventName: event.eventName,
      aggregateId: event.aggregateId,
      data: event.getEventData(),
    });
  }

  async start(): Promise<void> {
    this.worker = new Worker(
      this.queueName,
      async (job: Job) => {
        const { eventName } = job.data;
        const handlers = this.handlers.get(eventName) ?? [];

        for (const handler of handlers) {
          const event = this.reconstructEvent(job.data);
          await handler.handle(event);
        }
      },
      { connection: this.connection },
    );

    await this.worker.waitUntilReady();
  }

  reconstructEvent(eventData: any): DomainEvent {
    return eventData as DomainEvent;
  }

  async close(): Promise<void> {
    await this.worker?.close();
    await this.queue.close();
  }
}
