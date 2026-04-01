import { Queue } from 'bullmq';

const connection = { url: process.env['REDIS_URL'] ?? 'redis://localhost:6379' };
const jobOpts    = { attempts: 3, backoff: { type: 'exponential' as const, delay: 2_000 } };

const emailQueue = new Queue('notification-email', { connection, defaultJobOptions: jobOpts });
const smsQueue   = new Queue('notification-sms',   { connection, defaultJobOptions: jobOpts });

export async function publishDriverCredentials(opts: {
  recipientId:  string;
  email:        string;
  telephone:    string;
  prenom:       string;
  nom:          string;
  tempPassword: string;
}): Promise<void> {
  const { recipientId, email, telephone, prenom, nom, tempPassword } = opts;

  const emailBody = [
    `Bonjour ${prenom} ${nom},`,
    ``,
    `Votre compte chauffeur Elimmekatruck a été créé par votre transporteur.`,
    ``,
    `Vos identifiants de connexion :`,
    `  • Email : ${email}`,
    `  • Mot de passe temporaire : ${tempPassword}`,
    ``,
    `Connectez-vous sur la plateforme et changez votre mot de passe dès que possible.`,
    ``,
    `L'équipe Elimmekatruck 🚛`,
  ].join('\n');

  await emailQueue.add('driver-credentials-email', {
    recipientId,
    to:      email,
    subject: 'Vos identifiants Elimmekatruck',
    body:    emailBody,
  });

  await smsQueue.add('driver-credentials-sms', {
    recipientId,
    to:      telephone,
    message: `Bonjour ${prenom}, votre compte Elimmekatruck est prêt.\nEmail: ${email}\nMot de passe: ${tempPassword}`,
  });
}
