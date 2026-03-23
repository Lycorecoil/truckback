import { z } from 'zod';

export const SendEmailSchema = z.object({
  recipientId: z.string({ error: 'recipientId requis' }).min(1, 'recipientId requis'),
  to:          z.string().email('Adresse email invalide'),
  subject:     z.string({ error: 'subject requis' }).min(1, 'subject requis'),
  body:        z.string({ error: 'body requis' }).min(1, 'body requis'),
});

export const SendSmsSchema = z.object({
  recipientId: z.string({ error: 'recipientId requis' }).min(1, 'recipientId requis'),
  to:          z.string().min(8, 'Numéro de téléphone invalide'),
  message:     z.string({ error: 'message requis' }).min(1, 'message requis'),
});
