const PDFDocument = require('./pdfgen/node_modules/pdfkit');
const fs = require('fs');

const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true, info: { Title: 'Cahier des Charges Frontend Elimmekatruck', Author: 'Elimmeka International' } });
const out = fs.createWriteStream('Cahier_des_Charges_Frontend_Elimmekatruck.pdf');
doc.pipe(out);

const BLUE  = '#1a56db';
const DARK  = '#1a1a2e';
const GRAY  = '#6b7280';
const LIGHT = '#f3f4f6';

// ── HELPERS ──────────────────────────────────────────────────────────────────
function h1(text) {
  if (doc.y > doc.page.height - 120) doc.addPage();
  doc.moveDown(0.5);
  doc.rect(50, doc.y, doc.page.width - 100, 30).fill(BLUE);
  const ty = doc.y - 21;
  doc.fillColor('white').fontSize(13).font('Helvetica-Bold').text(text, 62, ty);
  doc.y = ty + 38;
  doc.fillColor(DARK);
}

function h2(text) {
  if (doc.y > doc.page.height - 100) doc.addPage();
  doc.moveDown(0.5);
  doc.fillColor(BLUE).fontSize(11).font('Helvetica-Bold').text(text);
  doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor(BLUE).stroke();
  doc.moveDown(0.4);
  doc.fillColor(DARK);
}

function h3(text) {
  doc.moveDown(0.3);
  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text(text);
  doc.moveDown(0.2);
}

function body(text) {
  doc.fillColor(DARK).fontSize(10).font('Helvetica').text(text, { lineGap: 3 });
  doc.moveDown(0.3);
}

function bullet(items) {
  for (const item of items) {
    if (doc.y > doc.page.height - 60) doc.addPage();
    doc.fillColor(DARK).fontSize(10).font('Helvetica').text('•  ' + item, { indent: 20, lineGap: 2 });
  }
  doc.moveDown(0.3);
}

function code(text) {
  const lines = text.split('\n');
  const h = lines.length * 13 + 16;
  if (doc.y + h > doc.page.height - 60) doc.addPage();
  doc.rect(50, doc.y, doc.page.width - 100, h).fill('#1e1e1e');
  doc.fillColor('#9cdcfe').fontSize(8.5).font('Courier').text(text, 62, doc.y - h + 8, { lineGap: 3 });
  doc.y += 8;
  doc.moveDown(0.5);
}

function tableRow(cols, widths, isHeader) {
  const totalW = widths.reduce((a, b) => a + b, 0);
  const rowH = 18;
  if (doc.y + rowH > doc.page.height - 60) { doc.addPage(); }
  const rowY = doc.y;
  doc.rect(50, rowY, totalW, rowH).fill(isHeader ? BLUE : (Math.floor(rowY) % 36 < 18 ? LIGHT : 'white'));
  let x = 50;
  for (let i = 0; i < cols.length; i++) {
    doc.fillColor(isHeader ? 'white' : DARK)
       .fontSize(8.5)
       .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
       .text(cols[i], x + 4, rowY + 4, { width: widths[i] - 8, lineBreak: false });
    x += widths[i];
  }
  doc.y = rowY + rowH + 1;
}

// ── PAGE DE COUVERTURE ────────────────────────────────────────────────────────
doc.rect(0, 0, doc.page.width, 210).fill(BLUE);
doc.fillColor('white').fontSize(26).font('Helvetica-Bold')
   .text('CAHIER DES CHARGES', 50, 55, { align: 'center' });
doc.fontSize(18).font('Helvetica')
   .text('Interface Frontend', 50, 95, { align: 'center' });
doc.fontSize(13)
   .text('Elimmekatruck — Plateforme B2B de Transport', 50, 128, { align: 'center' });

doc.roundedRect(100, 240, doc.page.width - 200, 175, 8).fill(LIGHT);
doc.fillColor(DARK);
const meta = [
  ['Projet',           'Elimmekatruck Frontend'],
  ['Client',           'Elimmeka International'],
  ['Version',          '1.0'],
  ['Date',             'Mars 2026'],
  ['Backend',          'Node.js / TypeScript / MongoDB (déjà opérationnel)'],
  ['Frontend Web',     'Angular 17+'],
  ['Frontend Mobile',  'Flutter 3.x'],
];
let my = 258;
for (const [k, v] of meta) {
  doc.fillColor(GRAY).fontSize(9.5).font('Helvetica-Bold').text(k + ' :', 120, my);
  doc.fillColor(DARK).font('Helvetica').text(v, 260, my);
  my += 22;
}

// ── TABLE DES MATIÈRES ───────────────────────────────────────────────────────
doc.addPage();
h1('TABLE DES MATIÈRES');
const toc = [
  '1.  Présentation du Projet',
  '2.  Architecture Technique',
  '3.  Rôles et Permissions',
  '4.  Modules Fonctionnels — Angular Web',
  '5.  Modules Fonctionnels — Flutter Mobile',
  '6.  Endpoints API Disponibles',
  '7.  Configuration Environnement',
  '8.  Flux Utilisateurs Principaux',
  '9.  Critères d\'Acceptation',
  '10. Livrables Attendus',
  '11. Schémas JSON de Référence',
];
for (const t of toc) {
  doc.fillColor(DARK).fontSize(10).font('Helvetica').text(t, 70);
  doc.moveDown(0.35);
}

// ── 1. PRÉSENTATION ──────────────────────────────────────────────────────────
doc.addPage();
h1('1. PRÉSENTATION DU PROJET');
h2('1.1 Contexte');
body('Elimmekatruck est une plateforme B2B de mise en relation entre expéditeurs (entreprises avec des marchandises à transporter) et transporteurs (propriétaires de camions). La plateforme gère l\'intégralité du cycle de vie d\'une expédition — du dépôt de l\'annonce jusqu\'à la livraison confirmée — avec suivi GPS en temps réel.');

h2('1.2 Objectif');
body('Développer les interfaces utilisateurs Angular (web) et Flutter (mobile) qui consomment le backend REST déjà opérationnel. Le backend expose des endpoints sécurisés via JWT RS256, avec une gestion fine des rôles (RBAC).');

h2('1.3 Périmètre');
bullet([
  'Interface Web Angular 17+ : Expéditeur, Transporteur, Admin',
  'Application Mobile Flutter : Expéditeur, Transporteur, Chauffeur',
  'Suivi GPS temps réel via WebSocket (port 3007)',
  'Notifications email/SMS automatiques gérées par le backend',
]);

// ── 2. ARCHITECTURE ──────────────────────────────────────────────────────────
doc.addPage();
h1('2. ARCHITECTURE TECHNIQUE');
h2('2.1 Stack Technique');
tableRow(['Composant','Technologie','Version','Usage'], [100,100,70,230], true);
tableRow(['Frontend Web','Angular','17+','Dashboard Expéditeur / Transporteur / Admin'], [100,100,70,230], false);
tableRow(['Frontend Mobile','Flutter','3.x','App Chauffeur / Expéditeur / Transporteur'], [100,100,70,230], false);
tableRow(['Backend API','Node.js / TypeScript','18+','REST API — déjà opérationnel'], [100,100,70,230], false);
tableRow(['Base de données','MongoDB 7','Replica Set rs0','Données métier isolées par tenant'], [100,100,70,230], false);
tableRow(['Cache / Queue','Redis 7','7.x','Rate limiting, BullMQ notifications'], [100,100,70,230], false);
tableRow(['Auth','JWT RS256','-','Tokens signés, refresh tokens 7 jours'], [100,100,70,230], false);
tableRow(['Temps réel','WebSocket','Socket.io','GPS tracking live'], [100,100,70,230], false);
tableRow(['Observabilité','Prometheus / Grafana','-','Métriques, alertes'], [100,100,70,230], false);

doc.moveDown(0.8);
h2('2.2 URLs de Base');
bullet([
  'API Gateway (REST) : http://localhost:80',
  'WebSocket GPS : ws://localhost:3007',
  'Toutes les routes API sont préfixées : /v1/...',
]);

h2('2.3 Authentification');
bullet([
  'Header obligatoire sur chaque requête protégée : Authorization: Bearer <access_token>',
  'Access token : durée 15 minutes',
  'Refresh token : durée 7 jours',
  'Rafraîchissement auto : POST /v1/auth/refresh',
  'Déconnexion : POST /v1/auth/logout (blackliste le token côté serveur)',
]);

h2('2.4 Multi-Tenant');
body('Chaque utilisateur appartient à un tenant (tenantId). Le backend isole automatiquement les données par tenant via le JWT. Le frontend n\'a pas à gérer cette isolation — il passe juste le token.');

// ── 3. RÔLES ET PERMISSIONS ──────────────────────────────────────────────────
doc.addPage();
h1('3. RÔLES ET PERMISSIONS');
h2('3.1 Définition des Rôles');
tableRow(['Rôle','Valeur JWT','Description','Interface'], [90,95,200,115], true);
tableRow(['Expéditeur','EXPEDITEUR','Entreprise avec marchandises à transporter','Web + Mobile'], [90,95,200,115], false);
tableRow(['Transporteur','TRANSPORTER','Propriétaire de camions et chauffeurs','Web + Mobile'], [90,95,200,115], false);
tableRow(['Chauffeur','DRIVER','Conduit les camions, envoie sa position GPS','Mobile uniquement'], [90,95,200,115], false);
tableRow(['Administrateur','ADMIN','Gestion globale de la plateforme','Web uniquement'], [90,95,200,115], false);

doc.moveDown(0.8);
h2('3.2 Matrice des Permissions');
tableRow(['Action','EXPEDITEUR','TRANSPORTER','DRIVER','ADMIN'], [175,75,90,65,95], true);
tableRow(['Créer une expédition','✓','✗','✗','✓'], [175,75,90,65,95], false);
tableRow(['Annuler une expédition','✓ (sienne)','✗','✗','✓'], [175,75,90,65,95], false);
tableRow(['Voir liste expéditions','✓ siennes+PENDING','✓ siennes+PENDING','✓ siennes+PENDING','✓ tout'], [175,75,90,65,95], false);
tableRow(['Voir détail expédition (:id)','✗ 403','✓ (sienne/PENDING)','✗ 403','✓'], [175,75,90,65,95], false);
tableRow(['Accepter une expédition','✗','✓','✗','✓'], [175,75,90,65,95], false);
tableRow(['Démarrer une livraison','✗','✗','✓ (assigné)','✓'], [175,75,90,65,95], false);
tableRow(['Confirmer livraison','✗','✗','✓ (assigné)','✓'], [175,75,90,65,95], false);
tableRow(['Créer / gérer un camion','✗','✓','✗','✓'], [175,75,90,65,95], false);
tableRow(['Créer un chauffeur','✗','✓','✗','✓'], [175,75,90,65,95], false);
tableRow(['Rechercher camions dispo','✗ 403','✓','✓','✓'], [175,75,90,65,95], false);
tableRow(['Envoyer position GPS','✗','✗','✓','✓'], [175,75,90,65,95], false);
tableRow(['Dashboard admin complet','✗','✗','✗','✓'], [175,75,90,65,95], false);

// ── 4. MODULES ANGULAR ───────────────────────────────────────────────────────
doc.addPage();
h1('4. MODULES FONCTIONNELS — ANGULAR WEB');

h2('4.1 Module Auth');
bullet([
  'Page de connexion (email + mot de passe)',
  'Page d\'inscription (rôle : EXPEDITEUR ou TRANSPORTER, email, mot de passe, tenantId)',
  'HTTP Interceptor Angular : injection automatique du token sur chaque requête',
  'AuthGuard : redirection vers /login si token absent ou expiré',
  'RoleGuard : redirection si le rôle n\'est pas autorisé sur la route',
  'Gestion refresh token auto (intercepteur 401)',
  'Page réinitialisation mot de passe',
]);

h2('4.2 Module Expéditeur');
h3('Dashboard');
bullet([
  'Compteurs : expéditions en cours, livrées ce mois, annulées',
  'Tableau des expéditions récentes avec badge de statut coloré',
  'Bouton d\'accès rapide "Nouvelle expédition"',
]);
h3('Gestion des Expéditions');
bullet([
  'Formulaire de création : marchandise, emballage, quantité, poids (kg), départ, destination, dates',
  'Liste paginée (siennes + PENDING disponibles) — filtre par statut',
  'Annulation avec modale de confirmation',
]);
h3('Profil Organisation');
bullet([
  'Formulaire : raison sociale, forme juridique, RCCM, IFU, secteur activité',
  'Adresse : pays, ville, boite postale',
  'Contact : email, téléphone',
  'Représentant légal : nom, prénom, fonction, email, téléphone',
]);

h2('4.3 Module Transporteur');
h3('Dashboard');
bullet([
  'Compteurs : camions disponibles, expéditions actives, chauffeurs actifs',
  'Feed des expéditions PENDING à accepter',
]);
h3('Gestion de la Flotte');
bullet([
  'Liste camions avec badge statut (AVAILABLE=vert, BUSY=orange, MAINTENANCE=rouge)',
  'Formulaire ajout camion : immatriculation, chassis, marque, modèle, type, capacité max (kg)',
  'Modifier / désactiver un camion',
  'Assigner un chauffeur à un camion',
  'Recherche camions disponibles par poids + ville départ + pays',
]);
h3('Gestion des Chauffeurs');
bullet([
  'Liste des chauffeurs du tenant',
  'Formulaire création chauffeur (crée aussi un compte DRIVER dans auth-service)',
  'Champs requis : nom, prénom, email, mot de passe, téléphone, numéro permis',
]);
h3('Gestion des Expéditions');
bullet([
  'Liste PENDING + les siennes déjà acceptées',
  'Détail expédition : marchandise, poids, départ/arrivée, dates',
  'Accepter une expédition : sélection du camion + chauffeur disponibles',
]);

h2('4.4 Module Admin');
bullet([
  'Liste paginée de tous les expéditeurs et transporteurs',
  'Suspension / activation d\'une organisation',
  'Liste complète des expéditions avec filtres (companyId, transporterId, statut)',
  'Envoi email / SMS manuel vers un utilisateur',
  'Dashboard métriques globales',
]);

h2('4.5 Composants Partagés');
bullet([
  'Navbar : nom utilisateur, rôle, bouton déconnexion',
  'Sidebar navigation contextuelle selon le rôle',
  'Badges statut colorés (PENDING=orange, ACCEPTED=bleu, IN_PROGRESS=violet, DELIVERED=vert, CANCELLED=rouge)',
  'Tableau générique paginé avec tri et filtre',
  'Toast notifications (succès / erreur / info)',
  'Loader global (spinner overlay)',
  'Composant carte Leaflet/Google Maps pour le suivi GPS',
  'Gestion erreurs globale (ErrorHandler Angular)',
]);

// ── 5. MODULES FLUTTER ───────────────────────────────────────────────────────
doc.addPage();
h1('5. MODULES FONCTIONNELS — FLUTTER MOBILE');

h2('5.1 Architecture Recommandée');
bullet([
  'State management : Riverpod (recommandé) ou Bloc',
  'HTTP client : Dio avec intercepteur JWT et refresh auto',
  'Navigation : GoRouter',
  'Cartes GPS : flutter_map (OpenStreetMap) ou google_maps_flutter',
  'WebSocket : socket_io_client',
  'Stockage sécurisé tokens : flutter_secure_storage',
  'Notifications push : firebase_messaging (optionnel)',
]);

h2('5.2 Écrans Communs');
bullet([
  'Splash Screen : vérification token → redirige vers Home ou Login',
  'Login Screen : email + mot de passe',
  'Home Screen adaptatif : détecte le rôle depuis le JWT et affiche l\'interface correspondante',
  'Profil utilisateur',
]);

h2('5.3 Écrans Expéditeur Mobile');
bullet([
  'Liste expéditions (siennes + PENDING) avec swipe-to-refresh',
  'Formulaire création expédition (formulaire multi-étapes)',
  'Carte de suivi GPS live via WebSocket ws://localhost:3007',
  'Annuler une expédition',
]);

h2('5.4 Écrans Transporteur Mobile');
bullet([
  'Feed expéditions PENDING disponibles',
  'Détail expédition : marchandise, poids, trajets',
  'Accepter expédition : sélection camion + chauffeur (dropdowns)',
  'Liste camions avec statut',
  'Ajouter un camion (formulaire)',
]);

h2('5.5 Écrans Chauffeur Mobile');
bullet([
  'Écran mission active : adresse de livraison, contact expéditeur',
  'Bouton "Démarrer la mission" → POST /v1/shipments/:id/start',
  'Service GPS background : envoi position toutes les 10 secondes → POST /v1/tracking/tracking',
  'Carte avec tracé du trajet en temps réel',
  'Bouton "Confirmer livraison" → POST /v1/shipments/:id/deliver',
  'Historique des missions passées',
]);

// ── 6. ENDPOINTS API ─────────────────────────────────────────────────────────
doc.addPage();
h1('6. ENDPOINTS API DISPONIBLES');

h2('6.1 Auth');
tableRow(['Méthode','Endpoint','Auth requis','Description'], [55,175,75,195], true);
tableRow(['POST','/v1/auth/signup','Non','Inscription (EXPEDITEUR ou TRANSPORTER)'], [55,175,75,195], false);
tableRow(['POST','/v1/auth/login','Non','Connexion → access_token + refresh_token'], [55,175,75,195], false);
tableRow(['POST','/v1/auth/logout','Oui','Déconnexion (blackliste le token Redis)'], [55,175,75,195], false);
tableRow(['POST','/v1/auth/refresh','Non','Renouveler l\'access token'], [55,175,75,195], false);
tableRow(['POST','/v1/auth/drivers','TRANSPORTER','Créer un compte Chauffeur'], [55,175,75,195], false);

doc.moveDown(0.5);
h2('6.2 Company');
tableRow(['Méthode','Endpoint','Rôle','Description'], [55,195,95,155], true);
tableRow(['POST','/v1/company/company','EXPEDITEUR','Créer profil expéditeur'], [55,195,95,155], false);
tableRow(['GET','/v1/company/company/:id','EXPEDITEUR','Voir profil expéditeur'], [55,195,95,155], false);
tableRow(['PUT','/v1/company/company/:id','EXPEDITEUR','Modifier profil expéditeur'], [55,195,95,155], false);
tableRow(['GET','/v1/company/company','ADMIN','Lister tous les expéditeurs'], [55,195,95,155], false);
tableRow(['POST','/v1/company/transporter','TRANSPORTER','Créer profil transporteur'], [55,195,95,155], false);
tableRow(['GET','/v1/company/transporter/:id','TRANSPORTER','Voir profil transporteur'], [55,195,95,155], false);
tableRow(['PUT','/v1/company/transporter/:id','TRANSPORTER','Modifier profil transporteur'], [55,195,95,155], false);
tableRow(['GET','/v1/company/transporter','ADMIN','Lister tous les transporteurs'], [55,195,95,155], false);

doc.moveDown(0.5);
h2('6.3 Fleet');
tableRow(['Méthode','Endpoint','Rôle','Description'], [55,205,110,130], true);
tableRow(['POST','/v1/fleet/trucks','TRANSPORTER','Ajouter un camion'], [55,205,110,130], false);
tableRow(['GET','/v1/fleet/trucks','TRANSPORTER','Mes camions (filtrés par tenant)'], [55,205,110,130], false);
tableRow(['GET','/v1/fleet/trucks/:id','Tous','Détail d\'un camion'], [55,205,110,130], false);
tableRow(['PUT','/v1/fleet/trucks/:id','TRANSPORTER','Modifier un camion'], [55,205,110,130], false);
tableRow(['DELETE','/v1/fleet/trucks/:id','TRANSPORTER','Désactiver (statut MAINTENANCE)'], [55,205,110,130], false);
tableRow(['GET','/v1/fleet/trucks/match','TRANSPORTER/DRIVER','Chercher camions dispo (poids+ville)'], [55,205,110,130], false);
tableRow(['POST','/v1/fleet/trucks/assign-driver','TRANSPORTER','Assigner chauffeur à un camion'], [55,205,110,130], false);
tableRow(['GET','/v1/fleet/drivers','TRANSPORTER','Mes chauffeurs'], [55,205,110,130], false);
tableRow(['GET','/v1/fleet/drivers/:id','TRANSPORTER','Détail chauffeur'], [55,205,110,130], false);

doc.moveDown(0.5);
h2('6.4 Shipments');
tableRow(['Méthode','Endpoint','Rôle','Description'], [55,215,110,120], true);
tableRow(['POST','/v1/shipments/shipments','EXPEDITEUR','Créer une expédition'], [55,215,110,120], false);
tableRow(['GET','/v1/shipments/shipments','Tous','Liste filtrée par rôle + PENDING'], [55,215,110,120], false);
tableRow(['GET','/v1/shipments/shipments/:id','TRANSPORTER/ADMIN','Détail (propre ou PENDING)'], [55,215,110,120], false);
tableRow(['DELETE','/v1/shipments/shipments/:id','EXPEDITEUR','Annuler (soft delete CANCELLED)'], [55,215,110,120], false);
tableRow(['POST','/v1/shipments/shipments/:id/accept','TRANSPORTER','Accepter + assigner truck+driver'], [55,215,110,120], false);
tableRow(['POST','/v1/shipments/shipments/:id/start','DRIVER','Démarrer la mission'], [55,215,110,120], false);
tableRow(['POST','/v1/shipments/shipments/:id/deliver','DRIVER','Confirmer livraison'], [55,215,110,120], false);

doc.moveDown(0.5);
h2('6.5 Tracking');
tableRow(['Méthode','Endpoint','Rôle','Description'], [55,215,110,120], true);
tableRow(['POST','/v1/tracking/tracking','DRIVER','Envoyer position GPS (lat, lng, shipmentId)'], [55,215,110,120], false);
tableRow(['GET','/v1/tracking/tracking/:id/last','Tous','Dernière position GPS'], [55,215,110,120], false);
tableRow(['GET','/v1/tracking/tracking/:id','Tous','Historique complet GPS'], [55,215,110,120], false);
tableRow(['WS','ws://localhost:3007','Tous','Suivi temps réel (Socket.io)'], [55,215,110,120], false);

// ── 7. CONFIGURATION ─────────────────────────────────────────────────────────
doc.addPage();
h1('7. CONFIGURATION ENVIRONNEMENT');

h2('7.1 Angular — environment.ts');
code(`export const environment = {
  production: false,
  apiUrl: 'http://localhost:80',
  wsUrl:  'ws://localhost:3007',
  tokenKey:        'elimmeka_access_token',
  refreshTokenKey: 'elimmeka_refresh_token',
};`);

h2('7.2 Flutter — AppConfig');
code(`class AppConfig {
  static const String apiBaseUrl        = 'http://localhost:80';
  static const String wsUrl             = 'ws://localhost:3007';
  static const String tokenKey          = 'access_token';
  static const String refreshTokenKey   = 'refresh_token';
}`);

h2('7.3 Variables Postman');
bullet([
  'base_url = http://localhost:80',
  'token_expediteur = (copier depuis POST /v1/auth/login avec role EXPEDITEUR)',
  'token_transporter = (copier depuis POST /v1/auth/login avec role TRANSPORTER)',
  'token_driver = (copier depuis POST /v1/auth/login avec role DRIVER)',
  'token_admin = (copier depuis POST /v1/auth/login avec email admin)',
  'expediteur_id, transporter_id, truck_id, driver_id, shipment_id = à remplir après création',
]);

// ── 8. FLUX UTILISATEURS ─────────────────────────────────────────────────────
doc.addPage();
h1('8. FLUX UTILISATEURS PRINCIPAUX');

h2('8.1 Flux Expéditeur — Créer et suivre une expédition');
bullet([
  '1. Inscription : POST /v1/auth/signup  { role: "EXPEDITEUR", email, password, tenantId }',
  '2. Connexion : POST /v1/auth/login → stocker access_token + refresh_token',
  '3. Créer profil : POST /v1/company/company',
  '4. Créer expédition : POST /v1/shipments/shipments',
  '5. Suivre statut : GET /v1/shipments/shipments (polling toutes les 30s ou WebSocket)',
  '6. Suivi GPS live : connexion WebSocket ws://localhost:3007, écouter event "tracking:<shipmentId>"',
]);

h2('8.2 Flux Transporteur — Accepter une expédition');
bullet([
  '1. Inscription : POST /v1/auth/signup  { role: "TRANSPORTER", email, password, tenantId }',
  '2. Connexion : POST /v1/auth/login',
  '3. Créer profil : POST /v1/company/transporter',
  '4. Ajouter camion : POST /v1/fleet/trucks',
  '5. Créer chauffeur : POST /v1/auth/drivers (crée un compte DRIVER)',
  '6. Assigner chauffeur : POST /v1/fleet/trucks/assign-driver  { truckId, driverId }',
  '7. Voir PENDING : GET /v1/shipments/shipments',
  '8. Voir détail : GET /v1/shipments/shipments/:id',
  '9. Accepter : POST /v1/shipments/shipments/:id/accept  { truckId, driverId }',
]);

h2('8.3 Flux Chauffeur — Effectuer une livraison');
bullet([
  '1. Connexion (compte créé par le Transporteur via POST /v1/auth/drivers)',
  '2. Voir mission : GET /v1/shipments/shipments → trouver expédition avec statut ACCEPTED',
  '3. Démarrer : POST /v1/shipments/shipments/:id/start',
  '4. Envoyer GPS toutes les 10s : POST /v1/tracking/tracking  { shipmentId, latitude, longitude }',
  '5. Confirmer livraison : POST /v1/shipments/shipments/:id/deliver',
]);

// ── 9. CRITÈRES D'ACCEPTATION ────────────────────────────────────────────────
doc.addPage();
h1('9. CRITÈRES D\'ACCEPTATION');

h2('9.1 Fonctionnels');
bullet([
  'Un EXPEDITEUR peut créer une expédition et la voir dans sa liste',
  'Un TRANSPORTER voit les expéditions PENDING et peut en accepter une',
  'Un DRIVER peut démarrer et terminer sa mission',
  'Le suivi GPS s\'affiche en temps réel sur la carte côté expéditeur',
  'Un EXPEDITEUR reçoit une 403 sur GET /v1/shipments/:id (règle de sécurité)',
  'Un EXPEDITEUR reçoit une 403 sur GET /v1/fleet/trucks/match',
  'La déconnexion invalide le token côté serveur (blacklist Redis)',
  'Le refresh token renouvelle l\'access token automatiquement sans déconnexion',
  'Les notifications email sont envoyées automatiquement à chaque changement de statut',
]);

h2('9.2 Techniques');
bullet([
  'Toutes les requêtes authentifiées incluent Authorization: Bearer <token>',
  'Les tokens ne sont pas stockés en clair (flutter_secure_storage / httpOnly cookie)',
  'L\'app redirige vers /login si le token est expiré (intercepteur 401)',
  'Les erreurs 403 affichent un message clair à l\'utilisateur',
  'Les formulaires valident les champs obligatoires avant soumission',
  'Interface web responsive — minimum 1024px de largeur',
  'App mobile compatible Android 8+ et iOS 13+',
  'Temps de chargement initial < 3 secondes sur connexion 4G',
]);

h2('9.3 Sécurité');
bullet([
  'Aucun token stocké en clair dans le code source ou les logs',
  'Variables d\'environnement pour toutes les URLs (pas d\'URL hardcodée)',
  'HTTPS obligatoire en production',
  'Pas d\'informations sensibles dans les logs console en production',
  'CORS respecté (le backend autorise localhost:3000 par défaut)',
]);

// ── 10. LIVRABLES ────────────────────────────────────────────────────────────
doc.addPage();
h1('10. LIVRABLES ATTENDUS');

h2('10.1 Angular Web');
bullet([
  'Code source dans /frontend-angular',
  'README.md avec instructions : npm install, ng serve, ng build',
  'Fichiers environment.ts et environment.prod.ts configurés',
  'Build de production généré : dist/elimmekatruck-web/',
  'Tests unitaires pour les services HTTP, guards, intercepteurs',
]);

h2('10.2 Flutter Mobile');
bullet([
  'Code source dans /frontend-flutter',
  'README.md avec instructions : flutter pub get, flutter run',
  'AppConfig.dart documenté',
  'APK de démonstration Android (debug)',
  'Gestion des permissions Android : ACCESS_FINE_LOCATION, INTERNET',
]);

h2('10.3 Documentation');
bullet([
  'Collection Postman à jour : elimmekatruck.postman_collection.json (déjà fournie)',
  'Variables Postman documentées : base_url, token_expediteur, token_transporter, token_driver, token_admin',
]);

// ── 11. SCHÉMAS JSON ─────────────────────────────────────────────────────────
doc.addPage();
h1('11. SCHÉMAS JSON DE RÉFÉRENCE');

h2('11.1 Signup Request');
code(`POST /v1/auth/signup
{
  "email":    "expediteur@entreprise.com",
  "password": "motdepasse123",
  "role":     "EXPEDITEUR",         // ou "TRANSPORTER"
  "tenantId": "entreprise-001"      // identifiant unique de l'organisation
}`);

h2('11.2 Login Response');
code(`POST /v1/auth/login → 200 OK
{
  "accessToken":  "eyJhbGciOiJSUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiJ9...",
  "user": {
    "id":       "uuid",
    "email":    "expediteur@entreprise.com",
    "role":     "EXPEDITEUR",
    "tenantId": "entreprise-001"
  }
}`);

h2('11.3 Objet Shipment');
code(`{
  "id":               "uuid",
  "companyId":        "uuid",        // ID de l'expéditeur
  "companyTenantId":  "string",
  "transporterId":    "uuid",        // Rempli après acceptation
  "driverId":         "uuid",        // Rempli après acceptation
  "marchandise":      "Ciment Portland",
  "emballage":        "Sacs 50kg",
  "quantite":         100,
  "poids":            5000,          // en kg
  "villeDepart":      "Cotonou",
  "paysDepart":       "Bénin",
  "villeArrivee":     "Ouagadougou",
  "paysArrivee":      "Burkina Faso",
  "statut":           "PENDING",     // PENDING|ACCEPTED|IN_PROGRESS|DELIVERED|CANCELLED
  "createdAt":        "2026-03-23T10:00:00Z",
  "updatedAt":        "2026-03-23T10:00:00Z"
}`);

h2('11.4 Accepter une Expédition');
code(`POST /v1/shipments/shipments/:id/accept
{
  "truckId":  "uuid",    // ID du camion sélectionné
  "driverId": "uuid"     // ID du chauffeur assigné
}`);

h2('11.5 Envoyer Position GPS (Chauffeur)');
code(`POST /v1/tracking/tracking
{
  "shipmentId": "uuid",
  "latitude":   6.3702928,
  "longitude":  2.3912362,
  "vitesse":    65          // km/h (optionnel)
}`);

h2('11.6 WebSocket GPS (Expéditeur — écoute)');
code(`// Connexion
const socket = io('ws://localhost:3007');

// Rejoindre le room de l'expédition
socket.emit('join', { shipmentId: 'uuid' });

// Recevoir les mises à jour GPS
socket.on('tracking:uuid', (data) => {
  console.log(data.latitude, data.longitude);
});`);

// ── FOOTERS ──────────────────────────────────────────────────────────────────
const range = doc.bufferedPageRange();
for (let i = 0; i < range.count; i++) {
  doc.switchToPage(range.start + i);
  if (i === 0) continue; // pas de footer sur la couverture
  doc.rect(0, doc.page.height - 36, doc.page.width, 36).fill(BLUE);
  doc.fillColor('white').fontSize(8).font('Helvetica')
     .text('Elimmekatruck — Cahier des Charges Frontend v1.0 — Confidentiel', 50, doc.page.height - 22, { lineBreak: false });
  doc.text('Page ' + i + ' / ' + (range.count - 1), 0, doc.page.height - 22, { align: 'right', width: doc.page.width - 50 });
}

doc.end();
out.on('finish', () => console.log('PDF OK'));
out.on('error', (e) => console.error('ERREUR:', e));
