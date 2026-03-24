/**
 * Migration : renomme le rôle/type COMPANY → EXPEDITEUR
 * Collections concernées :
 *   - auth-service  → User.role
 *   - company-service → Organization.type
 *
 * Usage :
 *   # Depuis le conteneur auth-service
 *   node scripts/migrate-company-to-expediteur.js auth
 *
 *   # Depuis le conteneur company-service
 *   node scripts/migrate-company-to-expediteur.js company
 *
 *   # Les deux (si accès à un seul MongoDB)
 *   node scripts/migrate-company-to-expediteur.js all
 *
 * Variables d'environnement :
 *   DATABASE_URL  (auth-service, Prisma/MongoDB)
 *   MONGO_URI     (company-service / fleet-service)
 */

const { MongoClient } = require('mongodb');

async function migrate() {
  const target = process.argv[2] ?? 'all';
  const uri = process.env['DATABASE_URL'] || process.env['MONGO_URI'];
  if (!uri) {
    console.error('❌ DATABASE_URL ou MONGO_URI requis');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB');

    const db = client.db();

    if (target === 'auth' || target === 'all') {
      const users = db.collection('User');
      const r1 = await users.updateMany({ role: 'COMPANY' }, { $set: { role: 'EXPEDITEUR' } });
      console.log(`✅ User.role    : ${r1.modifiedCount} document(s) mis à jour`);
    }

    if (target === 'company' || target === 'all') {
      const orgs = db.collection('Organization');
      const r2 = await orgs.updateMany({ type: 'COMPANY' }, { $set: { type: 'EXPEDITEUR' } });
      console.log(`✅ Organization.type : ${r2.modifiedCount} document(s) mis à jour`);
    }

    console.log('✅ Migration terminée');
  } catch (err) {
    console.error('❌ Erreur de migration :', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

migrate();
