import { Worker } from 'bullmq';
import { NodemailerEmailProvider } from '../providers/NodemailerEmailProvider';
import { getWhatsAppProvider } from '../providers/WhatsAppProvider';
import { MongoNotificationRepository } from '../repositories/MongoNotificationRepository';
import { Notification, NotificationChannel, NotificationStatus } from '../../domain/entities/Notification';
import { logger } from '../../utils/logger';
import { getRedisConnection } from './redisConnection';
import type { SendEmailDTO } from '../../application/dtos/SendEmailDTO';
import type { SendSmsDTO } from '../../application/dtos/SendSmsDTO';

const emailProvider  = new NodemailerEmailProvider();
const smsProvider    = getWhatsAppProvider();
const notifRepo      = new MongoNotificationRepository();

// ─── Email worker ─────────────────────────────────────────────────────────────
export const emailWorker = new Worker<SendEmailDTO>(
  'notification-email',
  async (job) => {
    // Lance si throw → BullMQ retente automatiquement
    await emailProvider.send({ to: job.data.to, subject: job.data.subject, body: job.data.body });
    await notifRepo.save(new Notification({
      recipientId: job.data.recipientId,
      channel: NotificationChannel.EMAIL,
      message: `${job.data.subject}: ${job.data.body}`,
      status: NotificationStatus.SENT,
    }));
  },
  { connection: getRedisConnection() },
);

emailWorker.on('failed', async (job, err) => {
  if (!job || job.attemptsMade < (job.opts.attempts ?? 3)) return;
  // Tous les essais épuisés — on enregistre l'échec
  try {
    await notifRepo.save(new Notification({
      recipientId: job.data.recipientId,
      channel: NotificationChannel.EMAIL,
      message: `${job.data.subject}: ${job.data.body}`,
      status: NotificationStatus.FAILED,
    }));
  } catch { /* ignore save error */ }
  logger.error({ jobId: job.id, err }, '[notification-service][queue] Email définitivement échoué');
});

// ─── SMS worker ───────────────────────────────────────────────────────────────
export const smsWorker = new Worker<SendSmsDTO>(
  'notification-sms',
  async (job) => {
    await smsProvider.send({ to: job.data.to, message: job.data.message });
    await notifRepo.save(new Notification({
      recipientId: job.data.recipientId,
      channel: NotificationChannel.SMS,
      message: job.data.message,
      status: NotificationStatus.SENT,
    }));
  },
  { connection: getRedisConnection() },
);

smsWorker.on('failed', async (job, err) => {
  if (!job || job.attemptsMade < (job.opts.attempts ?? 3)) return;
  try {
    await notifRepo.save(new Notification({
      recipientId: job.data.recipientId,
      channel: NotificationChannel.SMS,
      message: job.data.message,
      status: NotificationStatus.FAILED,
    }));
  } catch { /* ignore save error */ }
  logger.error({ jobId: job.id, err }, '[notification-service][queue] SMS définitivement échoué');
});
