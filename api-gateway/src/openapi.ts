/**
 * OpenAPI 3.0 specification — Camion Uber API
 * Served at GET /v1/docs via swagger-ui-express
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Camion Uber API',
    version: '1.0.0',
    description: 'API logistique B2B — mise en relation transporteurs et entreprises',
    contact: { name: 'Camion Uber Team' },
  },
  servers: [{ url: '/v1', description: 'API v1' }],

  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        required: ['success', 'code', 'error'],
        properties: {
          success: { type: 'boolean', example: false },
          code: { type: 'integer', example: 400 },
          error: { type: 'string', example: 'Message d\'erreur' },
        },
      },
      SignUpRequest: {
        type: 'object',
        required: ['email', 'password', 'role', 'tenantId'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          role: { type: 'string', enum: ['EXPEDITEUR', 'TRANSPORTER'] },
          tenantId: { type: 'string' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          refreshToken: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string' },
              tenantId: { type: 'string' },
            },
          },
        },
      },
      Shipment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          companyId: { type: 'string' },
          transporterId: { type: 'string', nullable: true },
          truckId: { type: 'string', nullable: true },
          driverId: { type: 'string', nullable: true },
          marchandise: { type: 'string' },
          poids: { type: 'number' },
          villeDepart: { type: 'string' },
          paysDepart: { type: 'string' },
          villeArrivee: { type: 'string' },
          paysArrivee: { type: 'string' },
          statut: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED'] },
          dateAnnonce: { type: 'string', format: 'date' },
          heureAnnonce: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateShipmentRequest: {
        type: 'object',
        required: ['marchandise', 'quantite', 'poids', 'villeDepart', 'paysDepart', 'villeArrivee', 'paysArrivee', 'dateAnnonce', 'heureAnnonce'],
        properties: {
          marchandise: { type: 'string' },
          emballage: { type: 'string' },
          quantite: { type: 'number', minimum: 0 },
          poids: { type: 'number', minimum: 0 },
          villeDepart: { type: 'string' },
          paysDepart: { type: 'string' },
          villeArrivee: { type: 'string' },
          paysArrivee: { type: 'string' },
          dateAnnonce: { type: 'string', format: 'date' },
          heureAnnonce: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
          prixTransport: { type: 'number' },
          commentaireGeneral: { type: 'string' },
        },
      },
      Truck: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          tenantId: { type: 'string' },
          immatriculation: { type: 'string' },
          marque: { type: 'string' },
          modele: { type: 'string' },
          typeVehicule: { type: 'string' },
          capaciteMax: { type: 'number' },
          statut: { type: 'string', enum: ['AVAILABLE', 'BUSY', 'MAINTENANCE'] },
          villeBase: { type: 'string' },
          paysBase: { type: 'string' },
        },
      },
      Organization: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'string' },
          siret: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      TrackingPoint: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          truckId: { type: 'string' },
          shipmentId: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          vitesse: { type: 'number', nullable: true },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  },

  security: [{ bearerAuth: [] }],

  paths: {
    // ─── Auth ─────────────────────────────────────────────────────────────────
    '/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Créer un compte',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SignUpRequest' } } } },
        responses: {
          201: { description: 'Compte créé', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: { description: 'Données invalides', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          409: { description: 'Email déjà utilisé', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Se connecter',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: {
          200: { description: 'Connexion réussie', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          401: { description: 'Identifiants invalides', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Se déconnecter (révoque le token)',
        responses: {
          204: { description: 'Déconnecté' },
          401: { description: 'Non authentifié', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Renouveler l\'access token',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } } } },
        responses: {
          200: { description: 'Nouveau token émis', content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, refreshToken: { type: 'string' } } } } } },
          401: { description: 'Refresh token invalide ou expiré', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Demander une réinitialisation de mot de passe',
        security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } } },
        responses: {
          200: { description: 'Email de réinitialisation envoyé' },
        },
      },
    },

    // ─── Shipments ────────────────────────────────────────────────────────────
    '/shipments': {
      get: {
        tags: ['Shipments'],
        summary: 'Lister les expéditions (filtrées par rôle)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'statut', in: 'query', schema: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED'] } },
        ],
        responses: {
          200: { description: 'Liste des expéditions', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Shipment' } } } } },
        },
      },
      post: {
        tags: ['Shipments'],
        summary: 'Créer une expédition (EXPEDITEUR uniquement)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateShipmentRequest' } } } },
        responses: {
          201: { description: 'Expédition créée', content: { 'application/json': { schema: { $ref: '#/components/schemas/Shipment' } } } },
          400: { description: 'Données invalides', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          403: { description: 'Rôle insuffisant', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/shipments/search': {
      get: {
        tags: ['Shipments'],
        summary: 'Rechercher des camions disponibles pour une annonce',
        parameters: [
          { name: 'poids', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'villeDepart', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'paysDepart', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'typeVehicule', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Liste des camions disponibles', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Truck' } } } } },
        },
      },
    },
    '/shipments/{id}': {
      get: {
        tags: ['Shipments'],
        summary: 'Détails d\'une expédition',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Expédition', content: { 'application/json': { schema: { $ref: '#/components/schemas/Shipment' } } } },
          403: { description: 'Accès refusé', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          404: { description: 'Non trouvée', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      delete: {
        tags: ['Shipments'],
        summary: 'Annuler une expédition (soft delete — EXPEDITEUR propriétaire)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Expédition annulée', content: { 'application/json': { schema: { $ref: '#/components/schemas/Shipment' } } } },
          403: { description: 'Accès refusé', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/shipments/{id}/accept': {
      post: {
        tags: ['Shipments'],
        summary: 'Accepter une expédition (TRANSPORTER uniquement)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['truckId', 'driverId'], properties: { truckId: { type: 'string' }, driverId: { type: 'string' } } } } },
        },
        responses: {
          200: { description: 'Expédition acceptée', content: { 'application/json': { schema: { $ref: '#/components/schemas/Shipment' } } } },
          403: { description: 'Rôle insuffisant', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          409: { description: 'Déjà acceptée par un autre transporteur', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/shipments/{id}/start': {
      post: {
        tags: ['Shipments'],
        summary: 'Démarrer la mission (DRIVER assigné)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Mission démarrée', content: { 'application/json': { schema: { $ref: '#/components/schemas/Shipment' } } } },
        },
      },
    },
    '/shipments/{id}/deliver': {
      post: {
        tags: ['Shipments'],
        summary: 'Confirmer la livraison (DRIVER assigné)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Livraison confirmée', content: { 'application/json': { schema: { $ref: '#/components/schemas/Shipment' } } } },
        },
      },
    },

    // ─── Fleet ────────────────────────────────────────────────────────────────
    '/fleet/trucks': {
      get: {
        tags: ['Fleet'],
        summary: 'Lister les camions du transporteur',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Liste des camions', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Truck' } } } } },
        },
      },
      post: {
        tags: ['Fleet'],
        summary: 'Ajouter un camion (TRANSPORTER)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Truck' } } } },
        responses: {
          201: { description: 'Camion créé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Truck' } } } },
        },
      },
    },
    '/fleet/trucks/match': {
      get: {
        tags: ['Fleet'],
        summary: 'Trouver les camions disponibles pour un chargement',
        parameters: [
          { name: 'poids', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'villeDepart', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'paysDepart', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Camions disponibles', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Truck' } } } } },
        },
      },
    },

    // ─── Tracking ─────────────────────────────────────────────────────────────
    '/tracking': {
      post: {
        tags: ['Tracking'],
        summary: 'Envoyer une position GPS (DRIVER)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['truckId', 'shipmentId', 'latitude', 'longitude'],
                properties: {
                  truckId: { type: 'string' },
                  shipmentId: { type: 'string' },
                  latitude: { type: 'number', minimum: -90, maximum: 90 },
                  longitude: { type: 'number', minimum: -180, maximum: 180 },
                  vitesse: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Position enregistrée', content: { 'application/json': { schema: { $ref: '#/components/schemas/TrackingPoint' } } } },
        },
      },
    },
    '/tracking/truck/{truckId}': {
      get: {
        tags: ['Tracking'],
        summary: 'Dernière position d\'un camion',
        parameters: [{ name: 'truckId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Dernière position', content: { 'application/json': { schema: { $ref: '#/components/schemas/TrackingPoint' } } } },
        },
      },
    },
    '/tracking/truck/{truckId}/history': {
      get: {
        tags: ['Tracking'],
        summary: 'Historique complet des positions d\'un camion',
        parameters: [{ name: 'truckId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Historique', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/TrackingPoint' } } } } },
        },
      },
    },

    // ─── Notifications ────────────────────────────────────────────────────────
    '/notification/email': {
      post: {
        tags: ['Notifications'],
        summary: 'Envoyer un email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['recipientId', 'to', 'subject', 'body'],
                properties: {
                  recipientId: { type: 'string' },
                  to: { type: 'string', format: 'email' },
                  subject: { type: 'string' },
                  body: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Email envoyé' },
        },
      },
    },

    // ─── Company ──────────────────────────────────────────────────────────────
    '/company': {
      get: {
        tags: ['Company'],
        summary: 'Lister les entreprises',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: { description: 'Liste', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Organization' } } } } },
        },
      },
      post: {
        tags: ['Company'],
        summary: 'Créer un profil entreprise',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Organization' } } } },
        responses: {
          201: { description: 'Profil créé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Organization' } } } },
        },
      },
    },
  },
};
