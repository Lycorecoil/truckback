import { z } from 'zod';

export const CreateShipmentSchema = z.object({
  marchandise:  z.string({ error: 'marchandise requise' }).min(1, 'marchandise requise'),
  emballage:    z.string().optional(),
  quantite:     z.number({ error: 'quantite doit être un nombre' }).positive('quantite doit être positive'),
  poids:        z.number({ error: 'poids doit être un nombre' }).positive('poids doit être positif'),
  villeDepart:  z.string({ error: 'villeDepart requise' }).min(1, 'villeDepart requise'),
  paysDepart:   z.string({ error: 'paysDepart requis' }).min(1, 'paysDepart requis'),
  villeArrivee: z.string({ error: 'villeArrivee requise' }).min(1, 'villeArrivee requise'),
  paysArrivee:  z.string({ error: 'paysArrivee requis' }).min(1, 'paysArrivee requis'),
  dateAnnonce:  z.string({ error: 'dateAnnonce requise' }).min(1, 'dateAnnonce requise'),
  heureAnnonce: z.string().regex(/^\d{2}:\d{2}$/, 'heureAnnonce format HH:MM requis'),
  prixTransport:z.number().positive().optional(),
  geolocDepart: z.object({
    latitude:  z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
  geolocArrivee: z.object({
    latitude:  z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
  commentaireGeneral: z.string().optional(),
});
