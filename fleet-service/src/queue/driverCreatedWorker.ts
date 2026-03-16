import { Worker } from 'bullmq';
import type { DriverService } from '../driver/driver.service';
import type { Driver } from '../driver/driver.entity';
import { logger } from '../utils/logger';

export interface DriverCreatedEvent {
  userId:       string;
  tenantId:     string;
  email:        string;
  telephone:    string;
  nom:          string;
  prenom:       string;
  numeroPermis: string;
}

export function startDriverCreatedWorker(driverService: DriverService): Worker<DriverCreatedEvent> {
  const url = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

  const worker = new Worker<DriverCreatedEvent>(
    'fleet.driver.created',
    async (job) => {
      const { userId, tenantId, email, telephone, nom, prenom, numeroPermis } = job.data;

      try {
        await driverService.createOne({
          id: userId, tenantId, email, telephone, nom, prenom, numeroPermis, statut: 'AVAILABLE',
        } as unknown as Omit<Driver, 'id'>);
        logger.info({ email }, '[fleet-service] Profil chauffeur créé via event');
      } catch (err: unknown) {
        // Idempotence — si le profil existe déjà (409), on ignore
        const status = (err as Record<string, unknown>)['status'];
        if (status === 409) {
          logger.info({ email }, '[fleet-service] Profil chauffeur déjà existant, event ignoré');
          return;
        }
        throw err;
      }
    },
    { connection: { url }, concurrency: 5 },
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, email: job?.data?.email, err }, '[fleet-service] driver.created job échoué définitivement');
  });

  return worker;
}
