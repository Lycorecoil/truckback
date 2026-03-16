require('dotenv').config();

const url = process.env.DATABASE_URL ?? 'mongodb://localhost:27017/notification-service';
const dbName = new URL(url.replace(/^mongodb(\+srv)?:\/\//, 'http://')).pathname.slice(1).split('?')[0] || 'notification-service';

const config = {
  mongodb: {
    url,
    databaseName: dbName,
    options: { serverSelectionTimeoutMS: 5_000 },
  },
  migrationsDir: 'migrations',
  changelogCollectionName: 'changelog',
  migrationFileExtension: '.js',
  useFileHash: false,
  moduleSystem: 'commonjs',
};

module.exports = config;
