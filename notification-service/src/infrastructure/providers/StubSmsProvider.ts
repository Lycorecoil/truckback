import { ISmsProvider, SendSmsOptions } from '../../application/ports/ISmsProvider';

// MVP : log en console — brancher Twilio / Africa's Talking en production
export class StubSmsProvider implements ISmsProvider {
  async send(options: SendSmsOptions): Promise<void> {
    console.log('[notification-service][SMS]', {
      to: options.to,
      message: options.message,
    });
  }
}
