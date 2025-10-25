# Kafka trong Monorepo - Vai trò và Use Cases

## So Sánh: Kafka vs RabbitMQ/BullMQ

| Tiêu chí | BullMQ/RabbitMQ | Kafka |
|----------|-----------------|-------|
| **Pattern** | Message Queue (Task Queue) | Event Streaming / Event Log |
| **Use Case** | Background jobs, Task processing | Event streaming, Analytics, Audit logs |
| **Message Retention** | Xóa sau khi consume | Giữ lại theo thời gian (days/weeks) |
| **Ordering** | Per queue | Per partition (strong ordering) |
| **Replayability** | ❌ Không | ✅ Có thể replay events |
| **Throughput** | Medium (10K-100K msg/s) | Very High (100K-1M+ msg/s) |
| **Latency** | Low (ms) | Medium (ms-seconds) |
| **Complexity** | Đơn giản | Phức tạp hơn |
| **Best For** | Job queue, Delayed tasks, Retries | Event sourcing, Streaming, Logs, CDC |

## Kiến Nghị Sử Dụng Kết Hợp

```
┌─────────────────────────────────────────────────────┐
│                   Your Monorepo                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐         ┌──────────────┐         │
│  │   BullMQ     │         │    Kafka     │         │
│  │  (Redis)     │         │              │         │
│  └──────────────┘         └──────────────┘         │
│        │                        │                   │
│        │                        │                   │
│        ▼                        ▼                   │
│  ┌──────────────┐         ┌──────────────┐         │
│  │ Task Queue   │         │Event Streaming│        │
│  │              │         │              │         │
│  │ • Email      │         │• User Events │         │
│  │ • Media      │         │• Audit Logs  │         │
│  │ • Batch      │         │• Analytics   │         │
│  │ • Retries    │         │• CDC         │         │
│  └──────────────┘         │• Replication │         │
│                           └──────────────┘         │
└─────────────────────────────────────────────────────┘
```

## Vai Trò của Kafka trong Monorepo

### 1. Event Sourcing & CQRS

**Problem:** Traditional CRUD không lưu lại history, khó audit và replay

**Solution với Kafka:**

```
Write Side (Command)              Event Store (Kafka)           Read Side (Query)
─────────────────────            ──────────────────           ──────────────────
                                                               
CreateUser Command   ──────►    user.created event    ──────►  User Read Model
                                                                (PostgreSQL)
                                       │                             
UpdateEmail Command  ──────►    email.updated event   ──────►  Email Read Model
                                       │                        (Elasticsearch)
                                       │                             
DeleteUser Command   ──────►    user.deleted event    ──────►  Analytics DB
                                       │                        (ClickHouse)
                                       │
                                       └──────────────────────► Audit Log DB
```

### 2. Real-time Analytics & Metrics

**Use Cases:**
- Tracking user behavior real-time
- Business metrics dashboard
- A/B testing data
- Performance monitoring

```
User Actions          Kafka Topics              Analytics Consumers
─────────────        ──────────────            ────────────────────

Page View    ───►   page-views-topic    ───►   Flink/Spark Streaming
                                               ├─► ClickHouse (Aggregated)
Click Event  ───►   click-events-topic  ───►   └─► Redis (Real-time counters)

Purchase     ───►   purchase-topic      ───►   Revenue Dashboard

Search       ───►   search-topic        ───►   Search Analytics
```

### 3. Audit Logging & Compliance

**Requirements:** 
- Immutable log của mọi actions
- Traceability
- Compliance (GDPR, SOC2)

```typescript
// Mọi operation quan trọng đều publish event
await kafkaProducer.send({
  topic: 'audit-logs',
  messages: [{
    key: userId,
    value: JSON.stringify({
      eventType: 'USER_DATA_ACCESSED',
      userId,
      accessedBy: adminId,
      resourceId: documentId,
      timestamp: new Date(),
      metadata: { ip, userAgent }
    })
  }]
});
```

### 4. Change Data Capture (CDC)

**Problem:** Synchronize data across services/databases

**Solution:**

```
PostgreSQL                Debezium/Kafka Connect        Target Systems
──────────                ──────────────────────        ──────────────

users table    ───────►   user-changes-topic    ───►   Elasticsearch (Search)
                                                        
orders table   ───────►   order-changes-topic   ───►   Data Warehouse
                                                        
products table ───────►   product-changes-topic ───►   Redis Cache
                                                        
                                                 ───►   Microservices
```

### 5. Inter-Service Communication (Microservices Migration)

**When you scale to microservices:**

```
Before (Monolith)              After (Microservices + Kafka)
─────────────────              ────────────────────────────

api/                           auth-service ─┐
├── auth/                                    │
├── users/                     user-service ─┤───► Kafka ◄───┬─ notification-service
├── orders/                                   │               │
├── payments/                  order-service ┘               └─ analytics-service
├── notifications/                                            
                               payment-service               
```

### 6. Event-Driven Architecture

**Loosely coupled services via events:**

```typescript
// Service A: Order Service
class OrderService {
  async createOrder(data: CreateOrderDto) {
    const order = await this.db.order.create(data);
    
    // Publish event thay vì call trực tiếp các services khác
    await this.kafka.publish('order.created', {
      orderId: order.id,
      userId: order.userId,
      amount: order.total,
      items: order.items
    });
    
    return order;
  }
}

// Service B: Inventory Service (listens to order.created)
class InventoryConsumer {
  @KafkaConsumer('order.created')
  async handleOrderCreated(event: OrderCreatedEvent) {
    await this.reduceStock(event.items);
  }
}

// Service C: Notification Service (listens to order.created)
class NotificationConsumer {
  @KafkaConsumer('order.created')
  async handleOrderCreated(event: OrderCreatedEvent) {
    await this.sendOrderConfirmation(event.userId, event.orderId);
  }
}

// Service D: Analytics Service (listens to order.created)
class AnalyticsConsumer {
  @KafkaConsumer('order.created')
  async handleOrderCreated(event: OrderCreatedEvent) {
    await this.trackRevenue(event);
  }
}
```

### 7. Log Aggregation & Monitoring

```
Application Logs          Kafka Topics              Processing
────────────────         ──────────────           ───────────

API Server Logs   ───►   logs-api-topic    ───►   ELK Stack
                                                   (Elasticsearch)
Worker Logs       ───►   logs-worker-topic ───►   
                                                   Grafana Loki
Error Logs        ───►   logs-error-topic  ───►   
                                                   Alerting System
Metrics           ───►   metrics-topic     ───►   Prometheus
```

### 8. Saga Pattern (Distributed Transactions)

**Problem:** Maintain data consistency across services without distributed transactions

```typescript
// Order Saga Orchestrator
class OrderSaga {
  async execute(orderId: string) {
    try {
      // Step 1: Reserve inventory
      await this.kafka.publish('inventory.reserve', { orderId });
      await this.waitForReply('inventory.reserved', orderId);
      
      // Step 2: Process payment
      await this.kafka.publish('payment.process', { orderId });
      await this.waitForReply('payment.processed', orderId);
      
      // Step 3: Confirm order
      await this.kafka.publish('order.confirm', { orderId });
      
    } catch (error) {
      // Compensating transactions
      await this.kafka.publish('inventory.release', { orderId });
      await this.kafka.publish('payment.refund', { orderId });
      await this.kafka.publish('order.cancel', { orderId });
    }
  }
}
```

## Cấu Trúc Package với Kafka

```
packages/
├── kafka/                           # Core Kafka package
│   ├── src/
│   │   ├── producer/
│   │   │   ├── kafka-producer.service.ts
│   │   │   └── producer.config.ts
│   │   ├── consumer/
│   │   │   ├── kafka-consumer.service.ts
│   │   │   └── consumer-group.config.ts
│   │   ├── decorators/
│   │   │   ├── kafka-consumer.decorator.ts
│   │   │   └── kafka-topic.decorator.ts
│   │   ├── streams/                # Kafka Streams
│   │   │   ├── stream-processor.ts
│   │   │   └── aggregations.ts
│   │   └── index.ts
│   └── package.json
│
├── event-sourcing/                  # Event sourcing utilities
│   ├── src/
│   │   ├── event-store/
│   │   │   ├── event-store.service.ts
│   │   │   └── event.repository.ts
│   │   ├── aggregates/
│   │   │   ├── base-aggregate.ts
│   │   │   └── user.aggregate.ts
│   │   ├── projections/
│   │   │   ├── projection.service.ts
│   │   │   └── user.projection.ts
│   │   ├── snapshots/
│   │   │   └── snapshot.service.ts
│   │   └── index.ts
│   └── package.json
│
├── cdc/                             # Change Data Capture
│   ├── src/
│   │   ├── connectors/
│   │   │   ├── postgres-cdc.connector.ts
│   │   │   └── debezium.config.ts
│   │   ├── transformers/
│   │   │   └── change-event.transformer.ts
│   │   └── index.ts
│   └── package.json
│
└── streaming-analytics/             # Real-time analytics
    ├── src/
    │   ├── processors/
    │   │   ├── windowing.processor.ts
    │   │   └── aggregation.processor.ts
    │   ├── sinks/
    │   │   ├── clickhouse.sink.ts
    │   │   └── elasticsearch.sink.ts
    │   └── index.ts
    └── package.json
```

## Implementation Examples

### 1. Basic Kafka Producer/Consumer

```typescript
// packages/kafka/src/producer/kafka-producer.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, ProducerRecord } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'my-app',
      brokers: process.env.KAFKA_BROKERS.split(','),
      retry: {
        retries: 5,
        initialRetryTime: 100,
        multiplier: 2
      }
    });
    
    this.producer = this.kafka.producer({
      allowAutoTopicCreation: false,
      transactionalId: 'my-app-producer',
      maxInFlightRequests: 5,
      idempotent: true // Exactly-once semantics
    });
  }

  async onModuleInit() {
    await this.producer.connect();
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async publish(topic: string, message: any, key?: string) {
    await this.producer.send({
      topic,
      messages: [
        {
          key: key || null,
          value: JSON.stringify(message),
          timestamp: Date.now().toString(),
          headers: {
            'correlation-id': this.generateCorrelationId(),
            'event-type': message.eventType || 'unknown'
          }
        }
      ]
    });
  }

  async publishBatch(records: ProducerRecord[]) {
    await this.producer.sendBatch({
      topicMessages: records
    });
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// packages/kafka/src/consumer/kafka-consumer.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';

@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  private kafka: Kafka;
  private consumers: Map<string, Consumer> = new Map();

  constructor() {
    this.kafka = new Kafka({
      clientId: 'my-app',
      brokers: process.env.KAFKA_BROKERS.split(',')
    });
  }

  async onModuleInit() {
    // Consumers will be registered via decorators
  }

  async subscribe(
    groupId: string,
    topics: string[],
    handler: (payload: EachMessagePayload) => Promise<void>
  ) {
    const consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000
    });

    await consumer.connect();
    await consumer.subscribe({
      topics,
      fromBeginning: false
    });

    await consumer.run({
      autoCommit: false,
      eachMessage: async (payload) => {
        try {
          await handler(payload);
          await consumer.commitOffsets([
            {
              topic: payload.topic,
              partition: payload.partition,
              offset: (parseInt(payload.message.offset) + 1).toString()
            }
          ]);
        } catch (error) {
          console.error('Error processing message:', error);
          // Implement error handling strategy
          // - Retry
          // - Dead letter queue
          // - Skip and log
        }
      }
    });

    this.consumers.set(groupId, consumer);
  }
}
```

### 2. Event Sourcing Implementation

```typescript
// packages/event-sourcing/src/event-store/event-store.service.ts
export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  version: number;
  timestamp: Date;
  data: any;
  metadata?: any;
}

@Injectable()
export class EventStore {
  constructor(
    private kafka: KafkaProducerService,
    private db: DatabaseService
  ) {}

  async appendEvents(
    aggregateId: string,
    aggregateType: string,
    events: DomainEvent[],
    expectedVersion: number
  ) {
    // Optimistic locking check
    const currentVersion = await this.getCurrentVersion(aggregateId);
    if (currentVersion !== expectedVersion) {
      throw new ConcurrencyError('Aggregate version mismatch');
    }

    // Save to database (for querying)
    await this.db.event.createMany({
      data: events.map(e => ({
        eventId: e.eventId,
        aggregateId,
        aggregateType,
        eventType: e.eventType,
        version: e.version,
        data: e.data,
        timestamp: e.timestamp
      }))
    });

    // Publish to Kafka (for streaming & projections)
    await this.kafka.publishBatch({
      topicMessages: events.map(event => ({
        topic: `${aggregateType}.events`,
        messages: [{
          key: aggregateId,
          value: JSON.stringify(event)
        }]
      }))
    });
  }

  async getEvents(
    aggregateId: string,
    fromVersion?: number
  ): Promise<DomainEvent[]> {
    return this.db.event.findMany({
      where: {
        aggregateId,
        ...(fromVersion && { version: { gte: fromVersion } })
      },
      orderBy: { version: 'asc' }
    });
  }
}

// packages/event-sourcing/src/aggregates/user.aggregate.ts
export class UserAggregate {
  private events: DomainEvent[] = [];
  
  id: string;
  email: string;
  name: string;
  version: number = 0;

  static create(id: string, email: string, name: string): UserAggregate {
    const user = new UserAggregate();
    user.apply(new UserCreatedEvent(id, email, name));
    return user;
  }

  changeEmail(newEmail: string) {
    this.apply(new EmailChangedEvent(this.id, newEmail));
  }

  private apply(event: DomainEvent) {
    this.events.push(event);
    this.version++;

    // Apply event to state
    switch (event.eventType) {
      case 'UserCreated':
        this.id = event.data.id;
        this.email = event.data.email;
        this.name = event.data.name;
        break;
      case 'EmailChanged':
        this.email = event.data.newEmail;
        break;
    }
  }

  getUncommittedEvents(): DomainEvent[] {
    return this.events;
  }

  markEventsAsCommitted() {
    this.events = [];
  }
}
```

### 3. CDC with Debezium

```typescript
// packages/cdc/src/connectors/postgres-cdc.connector.ts
@Injectable()
export class PostgresCDCConnector {
  constructor(
    private kafka: KafkaConsumerService,
    private cache: CacheService
  ) {}

  async start() {
    // Listen to Debezium CDC topics
    await this.kafka.subscribe(
      'cdc-consumer-group',
      ['dbserver1.public.users', 'dbserver1.public.orders'],
      async (payload) => {
        const change = JSON.parse(payload.message.value.toString());
        await this.handleChange(change);
      }
    );
  }

  private async handleChange(change: any) {
    const { op, after, before } = change.payload;

    switch (op) {
      case 'c': // Create
        await this.handleCreate(after);
        break;
      case 'u': // Update
        await this.handleUpdate(before, after);
        break;
      case 'd': // Delete
        await this.handleDelete(before);
        break;
    }
  }

  private async handleCreate(data: any) {
    // Invalidate cache
    await this.cache.delete(`user:${data.id}`);
    
    // Update Elasticsearch
    await this.elasticsearchService.index({
      index: 'users',
      id: data.id,
      body: data
    });
  }

  private async handleUpdate(before: any, after: any) {
    // Invalidate cache
    await this.cache.delete(`user:${after.id}`);
    
    // Update Elasticsearch
    await this.elasticsearchService.update({
      index: 'users',
      id: after.id,
      body: { doc: after }
    });

    // Notify via WebSocket
    await this.websocket.sendToUser(after.id, 'profile-updated', after);
  }
}
```

### 4. Real-time Analytics Processor

```typescript
// packages/streaming-analytics/src/processors/windowing.processor.ts
import { KafkaStreams, KStream } from 'kafka-streams';

@Injectable()
export class AnalyticsProcessor {
  private kafkaStreams: KafkaStreams;

  constructor() {
    const config = {
      kafkaHost: process.env.KAFKA_BROKERS,
      groupId: 'analytics-processor',
      clientName: 'analytics-streams',
      workerPerPartition: 1
    };

    this.kafkaStreams = new KafkaStreams(config);
  }

  async processPageViews() {
    const stream: KStream = this.kafkaStreams.getKStream('page-views');

    stream
      // Parse JSON
      .map(message => JSON.parse(message.value))
      
      // Window: 5 minute tumbling window
      .window({
        windowSize: 5 * 60 * 1000, // 5 minutes
        advanceBy: 5 * 60 * 1000
      })
      
      // Group by page URL
      .groupBy(event => event.pageUrl)
      
      // Count views per page
      .count()
      
      // Output to ClickHouse
      .forEach(async (result) => {
        await this.clickhouse.insert({
          table: 'page_views_5min',
          values: [{
            window_start: result.window.start,
            page_url: result.key,
            view_count: result.count,
            timestamp: new Date()
          }]
        });
      });

    stream.start();
  }

  async processUserBehavior() {
    const stream: KStream = this.kafkaStreams.getKStream('user-actions');

    stream
      .map(msg => JSON.parse(msg.value))
      
      // Sliding window: Last 1 hour
      .window({
        windowSize: 60 * 60 * 1000,
        advanceBy: 5 * 60 * 1000
      })
      
      // Group by userId
      .groupBy(event => event.userId)
      
      // Aggregate user activity
      .aggregate({
        initialValue: {
          pageViews: 0,
          clicks: 0,
          searches: 0,
          purchases: 0
        },
        aggregator: (agg, event) => {
          switch (event.type) {
            case 'page_view':
              agg.pageViews++;
              break;
            case 'click':
              agg.clicks++;
              break;
            case 'search':
              agg.searches++;
              break;
            case 'purchase':
              agg.purchases++;
              break;
          }
          return agg;
        }
      })
      
      // Detect high-value users in real-time
      .filter(result => result.value.purchases > 0 || result.value.clicks > 50)
      
      // Send to Redis for real-time access
      .forEach(async (result) => {
        await this.redis.setex(
          `user:activity:${result.key}`,
          3600, // 1 hour TTL
          JSON.stringify(result.value)
        );
        
        // Trigger notification for sales team
        if (result.value.purchases > 0) {
          await this.kafka.publish('high-value-user-detected', {
            userId: result.key,
            activity: result.value
          });
        }
      });

    stream.start();
  }
}
```

### 5. Saga Pattern Implementation

```typescript
// packages/kafka/src/saga/order-saga.orchestrator.ts
interface SagaStep {
  command: string;
  compensation: string;
  timeout: number;
}

@Injectable()
export class OrderSagaOrchestrator {
  private readonly steps: SagaStep[] = [
    {
      command: 'inventory.reserve',
      compensation: 'inventory.release',
      timeout: 5000
    },
    {
      command: 'payment.process',
      compensation: 'payment.refund',
      timeout: 10000
    },
    {
      command: 'shipping.create',
      compensation: 'shipping.cancel',
      timeout: 5000
    }
  ];

  constructor(
    private kafka: KafkaProducerService,
    private consumer: KafkaConsumerService,
    private db: DatabaseService
  ) {}

  async execute(orderId: string, orderData: any) {
    const sagaState = await this.initializeSaga(orderId, orderData);
    const completedSteps: number[] = [];

    try {
      for (let i = 0; i < this.steps.length; i++) {
        const step = this.steps[i];
        
        // Send command
        await this.kafka.publish(step.command, {
          sagaId: sagaState.id,
          orderId,
          data: orderData
        });

        // Wait for reply or timeout
        const success = await this.waitForReply(
          sagaState.id,
          step.command,
          step.timeout
        );

        if (!success) {
          throw new Error(`Step ${step.command} failed or timed out`);
        }

        completedSteps.push(i);
        await this.updateSagaProgress(sagaState.id, i);
      }

      // All steps completed successfully
      await this.completeSaga(sagaState.id);
      
      // Confirm order
      await this.kafka.publish('order.confirmed', { orderId });

    } catch (error) {
      // Execute compensating transactions in reverse order
      for (let i = completedSteps.length - 1; i >= 0; i--) {
        const step = this.steps[completedSteps[i]];
        
        await this.kafka.publish(step.compensation, {
          sagaId: sagaState.id,
          orderId,
          reason: error.message
        });
      }

      await this.failSaga(sagaState.id, error.message);
      
      // Cancel order
      await this.kafka.publish('order.cancelled', {
        orderId,
        reason: error.message
      });

      throw error;
    }
  }

  private async waitForReply(
    sagaId: string,
    command: string,
    timeout: number
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const replyTopic = `${command}.reply`;
      const timeoutHandle = setTimeout(() => resolve(false), timeout);

      // Subscribe to reply topic
      this.consumer.subscribe(
        `saga-${sagaId}`,
        [replyTopic],
        async (payload) => {
          const reply = JSON.parse(payload.message.value.toString());
          
          if (reply.sagaId === sagaId) {
            clearTimeout(timeoutHandle);
            resolve(reply.success);
          }
        }
      );
    });
  }
}
```

## Configuration

```typescript
// apps/api/src/config/kafka.config.ts
export const kafkaConfig = {
  clientId: 'my-app-api',
  brokers: process.env.KAFKA_BROKERS.split(','),
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production',
  
  // SASL authentication
  sasl: process.env.KAFKA_SASL_ENABLED === 'true' ? {
    mechanism: 'scram-sha-256',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD
  } : undefined,
  
  // Connection options
  connectionTimeout: 10000,
  requestTimeout: 30000,
  
  // Retry configuration
  retry: {
    retries: 8,
    initialRetryTime: 100,
    multiplier: 2,
    maxRetryTime: 30000
  },
  
  // Consumer configuration
  consumer: {
    groupId: 'my-app-consumer-group',
    sessionTimeout: 30000,
    rebalanceTimeout: 60000,
    heartbeatInterval: 3000,
    maxBytesPerPartition: 1048576,
    
    // Read from beginning on first start
    fromBeginning: false,
    
    // Auto commit
    autoCommit: false,
    autoCommitInterval: 5000
  },
  
  // Producer configuration
  producer: {
    allowAutoTopicCreation: false,
    transactionTimeout: 60000,
    
    // Exactly-once semantics
    idempotent: true,
    maxInFlightRequests: 5,
    
    // Compression
    compression: CompressionTypes.GZIP,
    
    // Batching
    batch: {
      size: 16384,
      maxBytes: 1048576
    },
    
    // Request timeout
    timeout: 30000
  }
};
```

## Topic Design Strategy

```yaml
# Kafka Topics Structure

# Domain Events (Event Sourcing)
user.events:
  partitions: 10
  replication: 3
  retention: 30 days
  compaction: false

order.events:
  partitions: 10
  replication: 3
  retention: 90 days
  compaction: false

# CDC Topics (from Debezium)
dbserver1.public.users:
  partitions: 5
  replication: 3
  retention: 7 days
  compaction: true  # Keep latest state

dbserver1.public.orders:
  partitions: 5
  replication: 3
  retention: 7 days
  compaction: true

# Analytics Topics
page-views:
  partitions: 20
  replication: 2
  retention: 7 days
  compaction: false

user-actions:
  partitions: 20
  replication: 2
  retention: 7 days
  compaction: false

# Audit Logs
audit-logs:
  partitions: 10
  replication: 3
  retention: 365 days  # Compliance requirement
  compaction: false

# Dead Letter Queue
dead-letter-queue:
  partitions: 5
  replication: 3
  retention: 30 days
  compaction: false
```

## Monitoring Kafka

```typescript
// packages/monitoring/src/kafka/kafka-metrics.ts
import { Gauge, Counter, Histogram } from 'prom-client';

export class KafkaMetrics {
  private messageProducedCounter: Counter;
  private messageConsumedCounter: Counter;
  private consumerLagGauge: Gauge;
  private processingDuration: Histogram;

  constructor(register: Registry) {
    this.messageProducedCounter = new Counter({
      name: 'kafka_messages_produced_total',
      help: 'Total number of messages produced',
      labelNames: ['topic'],
      registers: [register]
    });

    this.messageConsumedCounter = new Counter({
      name: 'kafka_messages_consumed_total',
      help: 'Total number of messages consumed',
      labelNames: ['topic', 'consumer_group'],
      registers: [register]
    });

    this.consumerLagGauge = new Gauge({
      name: 'kafka_consumer_lag',
      help: 'Consumer lag per topic partition',
      labelNames: ['topic', 'partition', 'consumer_group'],
      registers: [register]
    });

    this.processingDuration = new Histogram({
      name: 'kafka_message_processing_duration_seconds',
      help: 'Time to process Kafka messages',
      labelNames: ['topic', 'consumer_group'],
      buckets: [0.001, 0.01, 0.1, 0.5, 1, 5, 10],
      registers: [register]
    });
  }

  recordProduced(topic: string) {
    this.messageProducedCounter.inc({ topic });
  }

  recordConsumed(topic: string, consumerGroup: string) {
    this.messageConsumedCounter.inc({ topic, consumer_group: consumerGroup });
  }

  recordLag(topic: string, partition: number, consumerGroup: string, lag: number) {
    this.consumerLagGauge.set(
      { topic, partition: partition.toString(), consumer_group: consumerGroup },
      lag
    );
  }

  recordProcessingTime(topic: string, consumerGroup: string, duration: number) {
    this.processingDuration.observe(
      { topic, consumer_group: consumerGroup },
      duration
    );
  }
}
```

## Khi nào dùng Kafka vs BullMQ

### Dùng BullMQ khi:
- ✅ Simple task queue (email, image processing)
- ✅ Delayed jobs / Scheduled jobs
- ✅ Need job retries with exponential backoff
- ✅ Priority queues
- ✅ Small to medium scale (< 100K messages/day)
- ✅ Low latency requirement (< 100ms)

### Dùng Kafka khi:
- ✅ Event sourcing / CQRS
- ✅ Audit logging (need permanent history)
- ✅ Real-time analytics
- ✅ High throughput (> 100K messages/second)
- ✅ Need to replay events
- ✅ Multiple consumers need same data
- ✅ Change Data Capture
- ✅ Streaming processing
- ✅ Microservices communication

### Dùng Cả Hai khi:
```typescript
// Kafka for events → BullMQ for task execution

// 1. Kafka: Publish domain event
await kafka.publish('order.created', orderData);

// 2. Kafka Consumer: Listen and queue tasks
@KafkaConsumer('order.created')
async handleOrderCreated(event: OrderCreatedEvent) {
  // Queue immediate tasks with BullMQ
  await this.queue.add('send-confirmation-email', {
    email: event.customerEmail,
    orderId: event.orderId
  });
  
  await this.queue.add('update-inventory', {
    items: event.items
  }, {
    priority: 1 // High priority
  });
  
  // Queue delayed task
  await this.queue.add('reminder-email', {
    email: event.customerEmail
  }, {
    delay: 24 * 60 * 60 * 1000 // 24 hours
  });
}
```

## Migration Path

### Phase 1: Add Kafka alongside BullMQ
- Keep BullMQ for existing task queues
- Add Kafka for event streaming
- Start with audit logs and analytics

### Phase 2: Event Sourcing
- Migrate critical aggregates to event sourcing
- Keep CRUD for less critical data

### Phase 3: CDC
- Add Debezium for database replication
- Sync to Elasticsearch, cache, etc.

### Phase 4: Microservices
- Split services
- Use Kafka for inter-service communication
- Keep BullMQ for internal task queues per service

## TL;DR

**Kafka = Event Log / Streaming Platform**
- Lưu trữ events lâu dài
- Multiple consumers có thể replay
- Real-time analytics
- Event sourcing backbone

**BullMQ = Task Queue**
- Xử lý background jobs
- Retry logic
- Delayed jobs
- Simple và dễ dùng

**Best Practice: Dùng cả hai!**
- Kafka cho events & streaming
- BullMQ cho task execution
