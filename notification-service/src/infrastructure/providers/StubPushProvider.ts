import { IPushProvider, SendPushOptions } from '../../application/ports/IPushProvider';

// MVP : log en console — brancher Firebase Cloud Messaging (FCM) en production
export class StubPushProvider implements IPushProvider {
  async send(options: SendPushOptions): Promise<void> {
    console.log('[notification-service][PUSH]', {
      deviceToken: options.deviceToken,
      title: options.title,
      body: options.body,
    });
  }
}
