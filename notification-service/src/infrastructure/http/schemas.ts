import { z } from 'zod';

export const SendEmailSchema = z.object({
  recipientId: z.string({ required_error: 'recipientId requis' }).min(1, 'recipientId requis'),
  to:          z.string().email('Adresse email invalide'),
  subject:     z.string({ required_error: 'subject requis' }).min(1, 'subject requis'),
  body:        z.string({ required_error: 'body requis' }).min(1, 'body requis'),
});

export const SendSmsSchema = z.object({
  recipientId: z.string({ required_error: 'recipientId requis' }).min(1, 'recipientId requis'),
  to:          z.string().min(8, 'Numéro de téléphone invalide'),
  message:     z.string({ required_error: 'message requis' }).min(1, 'message requis'),
});
