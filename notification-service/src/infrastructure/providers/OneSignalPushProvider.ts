import { IPushProvider, SendPushOptions } from '../../application/ports/IPushProvider';
import { logger } from '../../utils/logger';

const ONESIGNAL_APP_ID      = process.env['ONESIGNAL_APP_ID']      ?? '';
const ONESIGNAL_REST_API_KEY = process.env['ONESIGNAL_REST_API_KEY'] ?? '';

export class OneSignalPushProvider implements IPushProvider {
  async send(options: SendPushOptions): Promise<void> {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      logger.warn('[notification-service][OneSignal] ONESIGNAL_APP_ID ou ONESIGNAL_REST_API_KEY manquant — push ignoré');
      return;
    }

    const payload = {
      app_id:                        ONESIGNAL_APP_ID,
      include_player_ids:            [options.deviceToken],
      headings:                      { fr: options.title, en: options.title },
      contents:                      { fr: options.body,  en: options.body  },
      android_channel_id:            'elimmekatruck-missions',
    };

    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error({ status: res.status, err, deviceToken: options.deviceToken }, '[notification-service][OneSignal] Échec envoi push');
      throw new Error(`OneSignal error ${res.status}: ${err}`);
    }

    const data = await res.json() as { id?: string; errors?: unknown };
    if (data.errors) {
      logger.warn({ errors: data.errors, deviceToken: options.deviceToken }, '[notification-service][OneSignal] Push envoyé avec erreurs partielles');
    } else {
      logger.info({ notificationId: data.id, deviceToken: options.deviceToken }, '[notification-service][OneSignal] Push envoyé');
    }
  }
}
