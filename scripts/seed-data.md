# Seed Data — Elimmekatruck

Données complètes pour peupler la plateforme. Toutes les routes passent par le gateway (`/v1/`).

---

## 1. Admin

L'admin est créé directement dans le container auth-service :

```bash
docker exec auth-service node dist/seed-admin.js
```

| Champ    | Valeur                       |
|----------|------------------------------|
| Email    | admin@elimmekatruck.com      |
| Password | Admin2026!                   |
| Role     | ADMIN                        |

---

## 2. Expéditeur

### 2a. Compte auth — `POST /v1/auth/signup`

```json
{
  "email":    "contact@sarl-mali-transport.com",
  "password": "Expediteur2026!",
  "role":     "EXPEDITEUR",
  "tenantId": "tenant-expediteur-sarl-mali"
}
```

### 2b. Profil organisation — `POST /v1/company/company`
_(avec le token de l'expéditeur)_

```json
{
  "raisonSociale":         "SARL Mali Transport & Négoce",
  "formeJuridique":        "SARL",
  "rccm":                  "BKO-2019-B-12457",
  "ifu":                   "000123456B",
  "secteurActivite":       "Commerce général et négoce",
  "pays":                  "Mali",
  "ville":                 "Bamako",
  "boitePostale":          "BP 4521",
  "email":                 "contact@sarl-mali-transport.com",
  "telephone":             "+22376543210",
  "nomRepresentant":       "Coulibaly",
  "prenomRepresentant":    "Mamadou",
  "fonctionRepresentant":  "Directeur Général",
  "emailRepresentant":     "mamadou.coulibaly@sarl-mali-transport.com",
  "telephoneRepresentant": "+22376543211"
}
```

**Résumé expéditeur**

| Champ    | Valeur                             |
|----------|------------------------------------|
| Email    | contact@sarl-mali-transport.com    |
| Password | Expediteur2026!                    |
| Role     | EXPEDITEUR                         |
| TenantID | tenant-expediteur-sarl-mali        |
| Société  | SARL Mali Transport & Négoce       |
| Ville    | Bamako, Mali                       |

---

## 3. Transporteur

### 3a. Compte auth — `POST /v1/auth/signup`

```json
{
  "email":    "contact@ouaga-express.com",
  "password": "Transporteur2026!",
  "role":     "TRANSPORTER",
  "tenantId": "tenant-transporteur-ouaga-express"
}
```

### 3b. Profil organisation — `POST /v1/company/transporter`
_(avec le token du transporteur)_

```json
{
  "raisonSociale":         "Ouaga Express Logistics SARL",
  "formeJuridique":        "SARL",
  "rccm":                  "OHG-2018-B-00341",
  "ifu":                   "000987654C",
  "secteurActivite":       "Transport routier de marchandises",
  "pays":                  "Burkina Faso",
  "ville":                 "Ouagadougou",
  "boitePostale":          "BP 1038",
  "email":                 "contact@ouaga-express.com",
  "telephone":             "+22670123456",
  "nomRepresentant":       "Sawadogo",
  "prenomRepresentant":    "Issa",
  "fonctionRepresentant":  "Gérant",
  "emailRepresentant":     "issa.sawadogo@ouaga-express.com",
  "telephoneRepresentant": "+22670123457"
}
```

### 3c. Camion — `POST /v1/fleet/trucks`
_(avec le token du transporteur)_

```json
{
  "immatriculation": "11B-5042-BF",
  "chassis":         "VIN-WDB9630521L476213",
  "marque":          "Mercedes-Benz",
  "modele":          "Actros 2545",
  "typeVehicule":    "Semi-remorque",
  "carrosserie":     "Benne basculante",
  "gabarit":         "13.6m",
  "capaciteMax":     30,
  "villeBase":       "Ouagadougou",
  "paysBase":        "Burkina Faso",
  "statut":          "AVAILABLE"
}
```

### 3d. Chauffeur — `POST /v1/fleet/drivers`
_(avec le token **admin** pour pouvoir spécifier le tenantId)_

```json
{
  "nom":          "Traoré",
  "prenom":       "Amadou",
  "email":        "amadou.traore@ouaga-express.com",
  "telephone":    "+22671234567",
  "numeroPermis": "BF-2021-00412",
  "statut":       "AVAILABLE",
  "tenantId":     "tenant-transporteur-ouaga-express"
}
```

**Résumé transporteur**

| Champ    | Valeur                                   |
|----------|------------------------------------------|
| Email    | contact@ouaga-express.com                |
| Password | Transporteur2026!                        |
| Role     | TRANSPORTER                              |
| TenantID | tenant-transporteur-ouaga-express        |
| Société  | Ouaga Express Logistics SARL             |
| Ville    | Ouagadougou, Burkina Faso                |
| Camion   | Mercedes-Benz Actros 2545 — 30T          |
| Immat.   | 11B-5042-BF                              |

**Résumé chauffeur**

| Champ    | Valeur                              |
|----------|-------------------------------------|
| Email    | amadou.traore@ouaga-express.com     |
| Role     | DRIVER                              |
| Permis   | BF-2021-00412                       |
| TenantID | tenant-transporteur-ouaga-express   |

---

## 4. Expéditions

Toutes créées avec le token de l'**expéditeur** via `POST /v1/shipments`.  
Le service injecte automatiquement `companyId` et `companyTenantId` depuis le JWT.

### Statuts couverts pour les graphiques admin

| # | Trajet | Statut | Prix |
| - | ------ | ------ | ---- |
| 1 | Bamako → Dakar | PENDING | 450 000 FCFA |
| 2 | Bamako → Abidjan | PENDING | 380 000 FCFA |
| 3 | Bamako → Ouagadougou | PENDING | 210 000 FCFA |
| 4 | Bamako → Niamey | IN_PROGRESS | 320 000 FCFA |
| 5 | Bamako → Conakry | IN_PROGRESS | 290 000 FCFA |
| 6 | Bamako → Lomé | DELIVERED | 410 000 FCFA |
| 7 | Bamako → Cotonou | DELIVERED | 370 000 FCFA |
| 8 | Bamako → Accra | DELIVERED | 430 000 FCFA |
| 9 | Bamako → Abidjan | CANCELLED | — |

> **Note statuts :** Créer toutes en PENDING via l'API, puis mettre à jour les statuts via `PUT /v1/shipments/:id` (admin) ou via les routes `/accept`, `/start`, `/deliver`.

---

### Expédition 1 — PENDING

```json
{
  "marchandise":        "Coton égréné en balles",
  "emballage":          "Balles compressées",
  "quantite":           120,
  "poids":              18,
  "villeDepart":        "Bamako",
  "paysDepart":         "Mali",
  "villeArrivee":       "Dakar",
  "paysArrivee":        "Sénégal",
  "dateAnnonce":        "2026-04-05",
  "heureAnnonce":       "08:00",
  "prixTransport":      450000,
  "geolocDepart":       { "latitude": 12.6392, "longitude": -8.0029 },
  "geolocArrivee":      { "latitude": 14.6928, "longitude": -17.4467 },
  "commentaireGeneral": "Livraison port de Dakar — camion bâché requis"
}
```

### Expédition 2 — PENDING

```json
{
  "marchandise":   "Mangues fraîches",
  "emballage":     "Caisses palettes",
  "quantite":      200,
  "poids":         12,
  "villeDepart":   "Bamako",
  "paysDepart":    "Mali",
  "villeArrivee":  "Abidjan",
  "paysArrivee":   "Côte d'Ivoire",
  "dateAnnonce":   "2026-04-06",
  "heureAnnonce":  "07:30",
  "prixTransport": 380000,
  "geolocDepart":  { "latitude": 12.6392, "longitude": -8.0029 },
  "geolocArrivee": { "latitude": 5.3599,  "longitude": -4.0083 }
}
```

### Expédition 3 — PENDING

```json
{
  "marchandise":   "Sacs de riz importé",
  "emballage":     "Sacs de 50 kg",
  "quantite":      400,
  "poids":         20,
  "villeDepart":   "Bamako",
  "paysDepart":    "Mali",
  "villeArrivee":  "Ouagadougou",
  "paysArrivee":   "Burkina Faso",
  "dateAnnonce":   "2026-04-07",
  "heureAnnonce":  "09:00",
  "prixTransport": 210000,
  "geolocDepart":  { "latitude": 12.6392, "longitude": -8.0029 },
  "geolocArrivee": { "latitude": 12.3569, "longitude": -1.5352 }
}
```

### Expédition 4 — IN_PROGRESS _(créer en PENDING, passer via `/start`)_

```json
{
  "marchandise":   "Ciment Portland en sacs",
  "emballage":     "Sacs de 50 kg palettisés",
  "quantite":      600,
  "poids":         30,
  "villeDepart":   "Bamako",
  "paysDepart":    "Mali",
  "villeArrivee":  "Niamey",
  "paysArrivee":   "Niger",
  "dateAnnonce":   "2026-03-20",
  "heureAnnonce":  "06:00",
  "prixTransport": 320000,
  "geolocDepart":  { "latitude": 12.6392, "longitude": -8.0029 },
  "geolocArrivee": { "latitude": 13.5137, "longitude":  2.1098 }
}
```

### Expédition 5 — IN_PROGRESS _(créer en PENDING, passer via `/start`)_

```json
{
  "marchandise":   "Pièces automobiles",
  "emballage":     "Caisses bois sécurisées",
  "quantite":      80,
  "poids":         8,
  "villeDepart":   "Bamako",
  "paysDepart":    "Mali",
  "villeArrivee":  "Conakry",
  "paysArrivee":   "Guinée",
  "dateAnnonce":   "2026-03-25",
  "heureAnnonce":  "10:00",
  "prixTransport": 290000,
  "geolocDepart":  { "latitude": 12.6392, "longitude": -8.0029 },
  "geolocArrivee": { "latitude":  9.5370, "longitude": -13.6773 }
}
```

### Expédition 6 — DELIVERED _(créer en PENDING, passer via `/accept` → `/start` → `/deliver`)_

```json
{
  "marchandise":   "Textiles et vêtements",
  "emballage":     "Balles de tissu",
  "quantite":      300,
  "poids":         15,
  "villeDepart":   "Bamako",
  "paysDepart":    "Mali",
  "villeArrivee":  "Lomé",
  "paysArrivee":   "Togo",
  "dateAnnonce":   "2026-02-10",
  "heureAnnonce":  "08:30",
  "prixTransport": 410000,
  "geolocDepart":  { "latitude": 12.6392, "longitude": -8.0029 },
  "geolocArrivee": { "latitude":  6.1375, "longitude":  1.2123 }
}
```

### Expédition 7 — DELIVERED

```json
{
  "marchandise":   "Noix de cajou décortiquées",
  "emballage":     "Sacs vacuum 25 kg",
  "quantite":      500,
  "poids":         12,
  "villeDepart":   "Bamako",
  "paysDepart":    "Mali",
  "villeArrivee":  "Cotonou",
  "paysArrivee":   "Bénin",
  "dateAnnonce":   "2026-02-20",
  "heureAnnonce":  "07:00",
  "prixTransport": 370000,
  "geolocDepart":  { "latitude": 12.6392, "longitude": -8.0029 },
  "geolocArrivee": { "latitude":  6.3703, "longitude":  2.3912 }
}
```

### Expédition 8 — DELIVERED

```json
{
  "marchandise":        "Huile de palme brute",
  "emballage":          "Fûts 200L",
  "quantite":           150,
  "poids":              25,
  "villeDepart":        "Bamako",
  "paysDepart":         "Mali",
  "villeArrivee":       "Accra",
  "paysArrivee":        "Ghana",
  "dateAnnonce":        "2026-03-05",
  "heureAnnonce":       "09:30",
  "prixTransport":      430000,
  "geolocDepart":       { "latitude": 12.6392, "longitude": -8.0029 },
  "geolocArrivee":      { "latitude":  5.5600, "longitude":  0.2057 },
  "commentaireGeneral": "Produit alimentaire — conditions de stockage contrôlées"
}
```

### Expédition 9 — CANCELLED _(créer en PENDING, passer via `DELETE /:id`)_

```json
{
  "marchandise":   "Matériaux de construction",
  "quantite":      1000,
  "poids":         28,
  "villeDepart":   "Bamako",
  "paysDepart":    "Mali",
  "villeArrivee":  "Abidjan",
  "paysArrivee":   "Côte d'Ivoire",
  "dateAnnonce":   "2026-03-15",
  "heureAnnonce":  "11:00"
}
```

---

## Récapitulatif des accès

| Rôle        | Email                            | Password          |
|-------------|----------------------------------|-------------------|
| ADMIN       | admin@elimmekatruck.com          | Admin2026!        |
| EXPEDITEUR  | contact@sarl-mali-transport.com  | Expediteur2026!   |
| TRANSPORTER | contact@ouaga-express.com        | Transporteur2026! |
| DRIVER      | amadou.traore@ouaga-express.com  | (créé par fleet)  |
