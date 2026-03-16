/**
 * Migration initiale : indexes sur la collection users
 *
 * - email unique (déjà implicite via le schema Mongoose mais déclaré explicitement)
 * - tenantId (filtrage multi-tenant fréquent)
 * - role (requêtes admin par rôle)
 */
module.exports = {
  async up(db) {
    await db.collection('users').createIndex(
      { email: 1 },
      { unique: true, name: 'users_email_unique' },
    );
    await db.collection('users').createIndex(
      { tenantId: 1 },
      { name: 'users_tenantId' },
    );
    await db.collection('users').createIndex(
      { role: 1 },
      { name: 'users_role' },
    );
  },

  async down(db) {
    await db.collection('users').dropIndex('users_email_unique');
    await db.collection('users').dropIndex('users_tenantId');
    await db.collection('users').dropIndex('users_role');
  },
};
