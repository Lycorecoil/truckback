import { Queue } from 'bullmq';

export interface DriverCreatedEvent {
  userId:       string;
  tenantId:     string;
  email:        string;
  telephone:    string;
  nom:          string;
  prenom:       string;
  numeroPermis: string;
}

let queue: Queue | null = null;

function getQueue(): Queue {
  if (!queue) {
    const url = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
    queue = new Queue('fleet.driver.created', { connection: { url } });
  }
  return queue;
}

export async function publishDriverCreated(event: DriverCreatedEvent): Promise<void> {
  await getQueue().add('driver.created', event, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  });
}
