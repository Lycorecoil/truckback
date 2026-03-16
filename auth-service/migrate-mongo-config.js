require('dotenv').config();

const url = process.env.DATABASE_URL ?? 'mongodb://localhost:27017/auth-service';

// Extrait le nom de la base depuis l'URL MongoDB
// ex: mongodb://user:pass@host/auth-service?replicaSet=rs0 → "auth-service"
const dbName = new URL(url.replace(/^mongodb(\+srv)?:\/\//, 'http://')).pathname.slice(1).split('?')[0] || 'auth-service';

const config = {
  mongodb: {
    url,
    databaseName: dbName,
    options: {
      serverSelectionTimeoutMS: 5_000,
    },
  },
  migrationsDir: 'migrations',
  changelogCollectionName: 'changelog',
  migrationFileExtension: '.js',
  useFileHash: false,
  moduleSystem: 'commonjs',
};

module.exports = config;
