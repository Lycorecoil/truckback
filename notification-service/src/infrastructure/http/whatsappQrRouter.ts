import { Router, Request, Response } from 'express';
import { getWhatsAppProvider } from '../providers/WhatsAppProvider';

export const whatsappQrRouter = Router();

whatsappQrRouter.get('/notification/whatsapp/qr', (_req: Request, res: Response) => {
  const provider = getWhatsAppProvider();

  if (provider.isReady()) {
    res.send(pageHtml(null, true));
    return;
  }

  const qr = provider.getQr();
  res.send(pageHtml(qr, false));
});

function pageHtml(qr: string | null, connected: boolean): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>WhatsApp — Elimmekatruck</title>
  ${!connected ? '<meta http-equiv="refresh" content="6">' : ''}
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f0f2f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      max-width: 420px;
      width: 90%;
      box-shadow: 0 4px 24px rgba(0,0,0,.10);
    }
    .logo {
      font-size: 2rem;
      margin-bottom: 8px;
    }
    h1 {
      font-size: 1.2rem;
      color: #111;
      margin-bottom: 4px;
    }
    p {
      font-size: .9rem;
      color: #667;
      margin-bottom: 24px;
    }
    #qr-box {
      background: #fff;
      border: 2px solid #e9edef;
      border-radius: 12px;
      padding: 20px;
      display: inline-block;
      margin-bottom: 20px;
    }
    .steps {
      text-align: left;
      background: #f0f2f5;
      border-radius: 10px;
      padding: 16px 20px;
      font-size: .85rem;
      color: #444;
      line-height: 1.8;
    }
    .steps b { color: #111; }
    .badge-connected {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #dcf8c6;
      color: #1a6b1a;
      font-weight: 600;
      font-size: 1rem;
      padding: 14px 28px;
      border-radius: 50px;
      margin-bottom: 16px;
    }
    .badge-waiting {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #fff3cd;
      color: #856404;
      font-size: .85rem;
      padding: 8px 16px;
      border-radius: 50px;
      margin-top: 12px;
    }
    .dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: currentColor;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; } 50% { opacity: .3; }
    }
  </style>
</head>
<body>
<div class="card">
  <div class="logo">🚛</div>
  <h1>Elimmekatruck — WhatsApp</h1>
  <p>Connectez votre téléphone pour envoyer les notifications aux chauffeurs</p>

  ${connected ? `
    <div class="badge-connected">
      ✅ WhatsApp connecté
    </div>
    <p style="color:#1a6b1a;font-weight:500">Votre téléphone est lié. Les messages seront envoyés automatiquement.</p>
  ` : qr ? `
    <div id="qr-box">
      <div id="qrcode"></div>
    </div>
    <div class="badge-waiting">
      <span class="dot"></span> En attente du scan — actualisation auto dans 6s
    </div>
    <br><br>
    <div class="steps">
      <b>Comment scanner :</b><br>
      1. Ouvrez WhatsApp sur votre téléphone<br>
      2. ⋮ → <b>Appareils liés</b><br>
      3. <b>Lier un appareil</b><br>
      4. Scannez ce QR code
    </div>
  ` : `
    <div class="badge-waiting">
      <span class="dot"></span> Démarrage de WhatsApp en cours…
    </div>
    <p style="margin-top:16px;font-size:.85rem">Le QR code apparaîtra dans quelques secondes. La page se rafraîchit automatiquement.</p>
  `}
</div>

${qr && !connected ? `
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<script>
  new QRCode(document.getElementById('qrcode'), {
    text: ${JSON.stringify(qr)},
    width: 256,
    height: 256,
    colorDark: '#111',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
</script>
` : ''}
</body>
</html>`;
}
