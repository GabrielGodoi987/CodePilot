/* ============================================
   EVENT-DRIVEN ARCHITECTURE + DDD
   Exemplo completo: Pedido de ecommerce
   ============================================ */

// ============ 1. DEFINIÇÃO DOS DOMAIN EVENTS ============

/**
 * Um Domain Event é um evento importante que aconteceu no domínio.
 * Sempre named no PASSADO e é IMUTÁVEL.
 */
abstract class DomainEvent {
  abstract readonly eventName: string;
  readonly occurredAt: Date = new Date();
  readonly aggregateId: string;

  constructor(aggregateId: string) {
    this.aggregateId = aggregateId;
  }

  // Serializar para enviar na fila
  toJSON() {
    return {
      eventName: this.eventName,
      aggregateId: this.aggregateId,
      occurredAt: this.occurredAt,
      data: this.getEventData(),
    };
  }

  abstract getEventData(): Record<string, any>;
}

// Evento emitido quando um pedido é criado
class OrderCreatedEvent extends DomainEvent {
  readonly eventName = "ORDER.CREATED";

  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly items: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>,
    public readonly totalAmount: number,
  ) {
    super(orderId);
  }

  getEventData() {
    return {
      orderId: this.orderId,
      customerId: this.customerId,
      items: this.items,
      totalAmount: this.totalAmount,
    };
  }
}

// Evento emitido quando pagamento é processado com sucesso
class PaymentProcessedEvent extends DomainEvent {
  readonly eventName = "PAYMENT.PROCESSED";

  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly amount: number,
    public readonly paymentMethod: string,
    public readonly transactionId: string,
  ) {
    super(orderId);
  }

  getEventData() {
    return {
      orderId: this.orderId,
      customerId: this.customerId,
      amount: this.amount,
      paymentMethod: this.paymentMethod,
      transactionId: this.transactionId,
    };
  }
}

// Evento emitido quando o pagamento falha
class PaymentFailedEvent extends DomainEvent {
  readonly eventName = "PAYMENT.FAILED";

  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly amount: number,
    public readonly reason: string,
  ) {
    super(orderId);
  }

  getEventData() {
    return {
      orderId: this.orderId,
      customerId: this.customerId,
      amount: this.amount,
      reason: this.reason,
    };
  }
}

// Evento emitido quando estoque é reservado
class InventoryReservedEvent extends DomainEvent {
  readonly eventName = "INVENTORY.RESERVED";

  constructor(
    public readonly orderId: string,
    public readonly items: Array<{ productId: string; quantity: number }>,
  ) {
    super(orderId);
  }

  getEventData() {
    return {
      orderId: this.orderId,
      items: this.items,
    };
  }
}

// Evento emitido quando o pedido é confirmado (tudo OK)
class OrderConfirmedEvent extends DomainEvent {
  readonly eventName = "ORDER.CONFIRMED";

  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
  ) {
    super(orderId);
  }

  getEventData() {
    return {
      orderId: this.orderId,
      customerId: this.customerId,
    };
  }
}

// ============ 2. AGGREGATE ROOT (DDD) ============

/**
 * Order Aggregate: A entidade raiz do contexto Order.
 * Responsável por manter as regras de negócio do pedido.
 */
class Order {
  private events: DomainEvent[] = [];
  private status: "PENDING" | "PAID" | "CONFIRMED" | "FAILED" = "PENDING";

  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly items: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>,
    public readonly totalAmount: number,
  ) {
    // Quando criamos um novo pedido, emitimos o evento
    this.events.push(
      new OrderCreatedEvent(orderId, customerId, items, totalAmount),
    );
  }

  // Quando pagamento é processado, o aggregate atualiza seu estado
  markAsPaymentProcessed(transactionId: string) {
    if (this.status !== "PENDING") {
      throw new Error("Pedido não está em estado pendente");
    }
    this.status = "PAID";
    this.events.push(
      new PaymentProcessedEvent(
        this.orderId,
        this.customerId,
        this.totalAmount,
        "CREDIT_CARD",
        transactionId,
      ),
    );
  }

  markAsConfirmed() {
    if (this.status !== "PAID") {
      throw new Error("Pedido não foi pago ainda");
    }
    this.status = "CONFIRMED";
    this.events.push(new OrderConfirmedEvent(this.orderId, this.customerId));
  }

  markAsFailed(reason: string) {
    this.status = "FAILED";
    this.events.push(
      new PaymentFailedEvent(
        this.orderId,
        this.customerId,
        this.totalAmount,
        reason,
      ),
    );
  }

  // Retorna os eventos que foram emitidos
  getDomainEvents(): DomainEvent[] {
    return this.events;
  }

  // Limpa os eventos após publicação (padrão Event Sourcing)
  clearDomainEvents() {
    this.events = [];
  }

  getStatus() {
    return this.status;
  }
}

// ============ 3. EVENT BUS (Barramento de Eventos) ============

/**
 * EventBus é o coração da arquitetura EDA.
 * Responsável por:
 * 1. Receber eventos de contextos produtores
 * 2. Colocar em fila (BullMQ)
 * 3. Disparar para handlers interessados
 */
import Bull from "bull";

type EventHandler = (event: DomainEvent) => Promise<void>;

class EventBus {
  private queue: Bull.Queue;
  private handlers: Map<string, EventHandler[]> = new Map();

  constructor(queueName: string = "domain-events") {
    // Criando a fila BullMQ - isso se conecta ao Redis
    this.queue = new Bull(queueName, {
      redis: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: parseInt(process.env.REDIS_PORT || "6379"),
      },
      defaultJobOptions: {
        attempts: 3, // Tenta 3 vezes antes de falhar
        backoff: {
          type: "exponential",
          delay: 2000, // Começa com 2 segundos
        },
      },
    });
  }

  /**
   * Subscribe: Um handler se registra para escutar eventos específicos
   * Exemplo: PaymentContext se registra para escutar "ORDER.CREATED"
   */
  subscribe(eventName: string, handler: EventHandler) {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)!.push(handler);
    console.log(`✅ Handler registrado para evento: ${eventName}`);
  }

  /**
   * Publish: Um contexto emite um evento para a fila
   * Fluxo:
   * 1. Evento chega aqui
   * 2. É serializado
   * 3. Entra na fila BullMQ
   * 4. Processadores consomem da fila
   */
  async publish(event: DomainEvent): Promise<void> {
    console.log(`📤 Publicando evento: ${event.eventName}`);

    // Colocar na fila
    await this.queue.add(
      {
        eventName: event.eventName,
        ...event.toJSON(),
      },
      {
        jobId: `${event.eventName}-${event.aggregateId}-${Date.now()}`,
      },
    );

    console.log(`✅ Evento adicionado à fila: ${event.eventName}`);
  }

  /**
   * Start: Começar a processar eventos da fila
   * Isso é executado no servidor, escutando continuamente a fila
   */
  async start() {
    // O process: é o "consumer" que pega jobs da fila
    this.queue.process(async (job) => {
      const { eventName, ...eventData } = job.data;

      console.log(`\n🔄 Processando evento da fila: ${eventName}`);
      console.log(`📊 Dados: ${JSON.stringify(eventData.data)}`);

      // Pegar todos os handlers registrados para este evento
      const handlersForEvent = this.handlers.get(eventName) || [];

      if (handlersForEvent.length === 0) {
        console.log(`⚠️  Nenhum handler registrado para: ${eventName}`);
        return;
      }

      // Executar todos os handlers em paralelo
      await Promise.all(
        handlersForEvent.map(async (handler) => {
          try {
            // Reconstituir o evento como objeto
            const reconstructedEvent = this.reconstructEvent(eventData);
            await handler(reconstructedEvent);
            console.log(`✅ Handler executado com sucesso para: ${eventName}`);
          } catch (error) {
            console.error(
              `❌ Erro ao executar handler para ${eventName}:`,
              error,
            );
            throw error; // Propagar para BullMQ fazer retry
          }
        }),
      );
    });

    // Listeners para entender o status da fila
    this.queue.on("completed", (job) => {
      console.log(`✅ Job completado: ${job.id}`);
    });

    this.queue.on("failed", (job, err) => {
      console.error(`❌ Job falhou: ${job.id} - ${err.message}`);
    });

    this.queue.on("error", (error) => {
      console.error(`❌ Erro na fila:`, error);
    });

    console.log("🚀 Event Bus iniciado e aguardando eventos...");
  }

  // Helper para reconstituir evento baseado no tipo
  private reconstructEvent(eventData: any): DomainEvent {
    switch (eventData.eventName) {
      case "ORDER.CREATED":
        return new OrderCreatedEvent(
          eventData.data.orderId,
          eventData.data.customerId,
          eventData.data.items,
          eventData.data.totalAmount,
        );
      case "PAYMENT.PROCESSED":
        return new PaymentProcessedEvent(
          eventData.data.orderId,
          eventData.data.customerId,
          eventData.data.amount,
          eventData.data.paymentMethod,
          eventData.data.transactionId,
        );
      case "PAYMENT.FAILED":
        return new PaymentFailedEvent(
          eventData.data.orderId,
          eventData.data.customerId,
          eventData.data.amount,
          eventData.data.reason,
        );
      case "INVENTORY.RESERVED":
        return new InventoryReservedEvent(
          eventData.data.orderId,
          eventData.data.items,
        );
      case "ORDER.CONFIRMED":
        return new OrderConfirmedEvent(
          eventData.data.orderId,
          eventData.data.customerId,
        );
      default:
        throw new Error(`Evento desconhecido: ${eventData.eventName}`);
    }
  }

  async close() {
    await this.queue.close();
  }
}

// ============ 4. CONTEXTOS DELIMITADOS (Bounded Contexts) ============

/**
 * ORDER CONTEXT
 * Responsável por criar e gerenciar pedidos
 */
class OrderContext {
  constructor(private eventBus: EventBus) {}

  async createOrder(customerId: string, items: any[]): Promise<Order> {
    const orderId = `ORD-${Date.now()}`;
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Criar o aggregate
    const order = new Order(orderId, customerId, items, totalAmount);

    // Publicar os eventos emitidos pelo aggregate
    const events = order.getDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    order.clearDomainEvents();

    console.log(`\n✅ [ORDER CONTEXT] Pedido criado: ${orderId}`);
    return order;
  }
}

/**
 * PAYMENT CONTEXT
 * Responsável por processar pagamentos
 * Escuta eventos de ORDER.CREATED
 */
class PaymentContext {
  constructor(private eventBus: EventBus) {
    // Se registra como interessado em ORDER.CREATED
    this.eventBus.subscribe(
      "ORDER.CREATED",
      this.handleOrderCreated.bind(this),
    );
  }

  private async handleOrderCreated(event: OrderCreatedEvent) {
    console.log(
      `\n💳 [PAYMENT CONTEXT] Novo pedido recebido para pagamento: ${event.orderId}`,
    );

    // Simular processamento de pagamento
    const success = Math.random() > 0.2; // 80% de sucesso

    if (success) {
      const transactionId = `TXN-${Date.now()}`;
      console.log(
        `✅ [PAYMENT CONTEXT] Pagamento processado com sucesso: ${transactionId}`,
      );

      // Emitir evento de sucesso
      await this.eventBus.publish(
        new PaymentProcessedEvent(
          event.orderId,
          event.customerId,
          event.totalAmount,
          "CREDIT_CARD",
          transactionId,
        ),
      );
    } else {
      console.log(`❌ [PAYMENT CONTEXT] Pagamento falhou`);

      // Emitir evento de falha
      await this.eventBus.publish(
        new PaymentFailedEvent(
          event.orderId,
          event.customerId,
          event.totalAmount,
          "Cartão recusado",
        ),
      );
    }
  }
}

/**
 * INVENTORY CONTEXT
 * Responsável por gerenciar estoque
 * Escuta eventos de PAYMENT.PROCESSED
 */
class InventoryContext {
  constructor(private eventBus: EventBus) {
    this.eventBus.subscribe(
      "PAYMENT.PROCESSED",
      this.handlePaymentProcessed.bind(this),
    );
  }

  private async handlePaymentProcessed(event: PaymentProcessedEvent) {
    console.log(
      `\n📦 [INVENTORY CONTEXT] Pagamento confirmado, reservando estoque para: ${event.orderId}`,
    );

    // Simular reserva de estoque
    // Em um sistema real, aqui você faria UPDATE no banco de dados
    const items = [
      { productId: "PROD-001", quantity: 1 },
      { productId: "PROD-002", quantity: 2 },
    ];

    console.log(`✅ [INVENTORY CONTEXT] Estoque reservado com sucesso`);

    // Emitir evento de sucesso
    await this.eventBus.publish(
      new InventoryReservedEvent(event.orderId, items),
    );
  }
}

/**
 * NOTIFICATION CONTEXT
 * Responsável por enviar notificações
 * Escuta múltiplos eventos
 */
class NotificationContext {
  constructor(private eventBus: EventBus) {
    this.eventBus.subscribe(
      "ORDER.CREATED",
      this.handleOrderCreated.bind(this),
    );
    this.eventBus.subscribe(
      "PAYMENT.PROCESSED",
      this.handlePaymentProcessed.bind(this),
    );
    this.eventBus.subscribe(
      "PAYMENT.FAILED",
      this.handlePaymentFailed.bind(this),
    );
    this.eventBus.subscribe(
      "ORDER.CONFIRMED",
      this.handleOrderConfirmed.bind(this),
    );
  }

  private async handleOrderCreated(event: OrderCreatedEvent) {
    console.log(
      `\n📧 [NOTIFICATION CONTEXT] Enviando email: "Pedido recebido" para ${event.customerId}`,
    );
  }

  private async handlePaymentProcessed(event: PaymentProcessedEvent) {
    console.log(
      `\n📧 [NOTIFICATION CONTEXT] Enviando email: "Pagamento confirmado" para ${event.customerId}`,
    );
  }

  private async handlePaymentFailed(event: PaymentFailedEvent) {
    console.log(
      `\n📧 [NOTIFICATION CONTEXT] Enviando email: "Pagamento falhou - ${event.reason}" para ${event.customerId}`,
    );
  }

  private async handleOrderConfirmed(event: OrderConfirmedEvent) {
    console.log(
      `\n📧 [NOTIFICATION CONTEXT] Enviando email: "Pedido confirmado" para ${event.customerId}`,
    );
  }
}

/**
 * CONFIRMATION CONTEXT (Orquestrador)
 * Responsável por confirmar o pedido quando tudo está pronto
 * Escuta eventos de INVENTORY.RESERVED
 */
class ConfirmationContext {
  constructor(private eventBus: EventBus) {
    this.eventBus.subscribe(
      "INVENTORY.RESERVED",
      this.handleInventoryReserved.bind(this),
    );
  }

  private async handleInventoryReserved(event: InventoryReservedEvent) {
    console.log(
      `\n✔️  [CONFIRMATION CONTEXT] Estoque reservado, confirmando pedido: ${event.orderId}`,
    );

    // Aqui você marcaria o pedido como CONFIRMED no banco de dados
    await this.eventBus.publish(
      new OrderConfirmedEvent(event.orderId, "CUSTOMER-123"),
    );

    console.log(`✅ [CONFIRMATION CONTEXT] Pedido confirmado com sucesso!`);
  }
}

// ============ 5. EXPRESS SERVER ============

import express from "express";

async function setupServer() {
  const app = express();
  app.use(express.json());

  // Instanciar o EventBus
  const eventBus = new EventBus("ecommerce-events");

  // Iniciar os contextos
  const orderContext = new OrderContext(eventBus);
  const paymentContext = new PaymentContext(eventBus);
  const inventoryContext = new InventoryContext(eventBus);
  const notificationContext = new NotificationContext(eventBus);
  const confirmationContext = new ConfirmationContext(eventBus);

  // Iniciar o processamento de eventos
  await eventBus.start();

  // ========== ROTAS ==========

  /**
   * POST /orders
   * Criar um novo pedido
   * Fluxo:
   * 1. Order Context cria o pedido
   * 2. Evento ORDER.CREATED é emitido
   * 3. Payment Context recebe o evento
   * 4. ... (cadeia de eventos)
   */
  app.post("/orders", async (req, res) => {
    try {
      const { customerId, items } = req.body;

      const order = await orderContext.createOrder(customerId, items);

      res.json({
        success: true,
        orderId: order.orderId,
        message: "Pedido criado! Processando pagamento...",
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  /**
   * GET /health
   * Verificar saúde da aplicação
   */
  app.get("/health", (req, res) => {
    res.json({ status: "OK", message: "Event-Driven Architecture rodando" });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`\n📝 Para testar, use:`);
    console.log(`curl -X POST http://localhost:${PORT}/orders \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{
      "customerId": "CUSTOMER-123",
      "items": [
        { "productId": "PROD-001", "quantity": 1, "price": 99.99 },
        { "productId": "PROD-002", "quantity": 2, "price": 49.99 }
      ]
    }'`);
  });

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("Encerrando aplicação...");
    await eventBus.close();
    process.exit(0);
  });
}

// Iniciar
setupServer().catch(console.error);

export {
  ConfirmationContext,
  DomainEvent,
  EventBus,
  InventoryContext,
  InventoryReservedEvent,
  NotificationContext,
  Order,
  OrderConfirmedEvent,
  OrderContext,
  OrderCreatedEvent,
  PaymentContext,
  PaymentFailedEvent,
  PaymentProcessedEvent,
};
