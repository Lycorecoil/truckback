import { z } from 'zod';

export const SignUpSchema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
  role:     z.enum(['EXPEDITEUR', 'TRANSPORTER'], { message: 'Rôle invalide (EXPEDITEUR ou TRANSPORTER)' }),
  tenantId: z.string({ required_error: 'tenantId requis' }).min(1, 'tenantId requis'),
});

export const LoginSchema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string({ required_error: 'Mot de passe requis' }).min(1, 'Mot de passe requis'),
});

export const CreateDriverSchema = z.object({
  email:        z.string().email('Email invalide'),
  password:     z.string().min(8, 'Mot de passe : 8 caractères minimum'),
  tenantId:     z.string({ required_error: 'tenantId requis' }).min(1, 'tenantId requis'),
  telephone:    z.string().min(8, 'Numéro de téléphone invalide'),
  nom:          z.string({ required_error: 'nom requis' }).min(1, 'nom requis'),
  prenom:       z.string({ required_error: 'prenom requis' }).min(1, 'prenom requis'),
  numeroPermis: z.string({ required_error: 'numeroPermis requis' }).min(1, 'numeroPermis requis'),
});
