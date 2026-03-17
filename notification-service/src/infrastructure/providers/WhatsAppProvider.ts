import fs from 'fs';
import path from 'path';
import { Client, LocalAuth, type Message } from 'whatsapp-web.js';
import { ISmsProvider, SendSmsOptions } from '../../application/ports/ISmsProvider';
import { logger } from '../../utils/logger';

/** Supprime les verrous Chromium résiduels (cas de redémarrage Docker). */
function clearChromiumLocks(sessionPath: string): void {
  const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
  const sessionDir = path.join(sessionPath, 'session');
  for (const file of lockFiles) {
    const p = path.join(sessionDir, file);
    try { fs.unlinkSync(p); } catch { /* ignoré si absent */ }
  }
}

// ─── Singleton — une seule instance Chromium dans le process ─────────────────
let instance: WhatsAppProvider | null = null;
export function getWhatsAppProvider(): WhatsAppProvider {
  if (!instance) instance = new WhatsAppProvider();
  return instance;
}

/**
 * WhatsAppProvider — implémente ISmsProvider via whatsapp-web.js
 *
 * Premier démarrage : un QR code s'affiche dans les logs Docker.
 * Scanner avec WhatsApp → Appareils liés → Scanner un QR code.
 * La session est ensuite sauvegardée dans .wwebjs_auth/ (volume Docker).
 */
export class WhatsAppProvider implements ISmsProvider {
  private client: Client;
  private ready = false;

  constructor() {
    const sessionPath = process.env['WHATSAPP_SESSION_PATH'] ?? '.wwebjs_auth';
    clearChromiumLocks(sessionPath);

    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: sessionPath,
      }),
      puppeteer: {
        // En Docker : utilise Chromium système (installé dans le Dockerfile)
        executablePath: process.env['PUPPETEER_EXECUTABLE_PATH'] ?? '/usr/bin/chromium-browser',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      },
    });

    this.client.on('qr', (qr) => {
      // Affiche le QR code en ASCII dans les logs Docker
      logger.info({ qr }, '[notification-service][WhatsApp] Scanner ce QR code avec WhatsApp');
      // Pour un affichage plus lisible en dev :
      if (process.env['NODE_ENV'] !== 'production') {
        import('qrcode-terminal').then((m) => m.default.generate(qr, { small: true })).catch(() => {});
      }
    });

    this.client.on('ready', () => {
      this.ready = true;
      logger.info('[notification-service][WhatsApp] Client prêt — session active');
    });

    this.client.on('disconnected', (reason) => {
      this.ready = false;
      logger.warn({ reason }, '[notification-service][WhatsApp] Client déconnecté');
    });

    this.client.on('auth_failure', (msg) => {
      logger.error({ msg }, '[notification-service][WhatsApp] Échec d\'authentification');
    });

    this.client.initialize().catch((err: unknown) => {
      logger.error({ err }, '[notification-service][WhatsApp] Erreur d\'initialisation');
    });
  }

  async send(options: SendSmsOptions): Promise<void> {
    if (!this.ready) {
      // Mode dev / client non prêt → log uniquement
      logger.info(
        { to: options.to, message: options.message },
        '[notification-service][WhatsApp][DEV] Client non prêt — message non envoyé',
      );
      return;
    }

    // Format WhatsApp : "33612345678@c.us" (sans le +)
    const chatId = `${options.to.replace(/^\+/, '')}@c.us`;

    await (this.client.sendMessage(chatId, options.message) as Promise<Message>);
    logger.info({ to: options.to }, '[notification-service][WhatsApp] Message envoyé');
  }

  /** Ferme proprement le client lors du graceful shutdown. */
  async destroy(): Promise<void> {
    if (this.ready) {
      await this.client.destroy();
      logger.info('[notification-service][WhatsApp] Client fermé');
    }
  }
}
