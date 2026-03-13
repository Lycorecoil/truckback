import { Queue } from 'bullmq';
import { getRedisConnection } from './redisConnection';

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2_000 },
  removeOnComplete: 100,
  removeOnFail: 50,
};

export const emailQueue = new Queue('notification:email', {
  connection: getRedisConnection(),
  defaultJobOptions,
});

export const smsQueue = new Queue('notification:sms', {
  connection: getRedisConnection(),
  defaultJobOptions,
});
