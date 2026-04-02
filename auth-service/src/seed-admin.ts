/**
 * Seed script — creates an ADMIN user if it doesn't already exist.
 * Usage (inside container):  npx ts-node src/seed-admin.ts
 * Usage (locally):           DATABASE_URL=<uri> npx ts-node src/seed-admin.ts
 */
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const DATABASE_URL =
  process.env['DATABASE_URL'] ??
  'mongodb://localhost:27017/auth-service';

const ADMIN_EMAIL    = 'admin@elimmekatruck.com';
const ADMIN_PASSWORD = 'Admin2026!';

const UserSchema = new mongoose.Schema(
  {
    id:        { type: String, required: true, unique: true },
    tenantId:  { type: String, required: true },
    email:     { type: String, required: true, unique: true },
    password:  { type: String, required: true },
    role:      { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);
const UserModel = mongoose.model('User', UserSchema);

async function seed() {
  await mongoose.connect(DATABASE_URL, { serverSelectionTimeoutMS: 5_000 });
  console.log('Connecté à MongoDB');

  const existing = await UserModel.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log(`Admin déjà existant : ${ADMIN_EMAIL}`);
    await mongoose.disconnect();
    return;
  }

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await UserModel.create({
    id:       randomUUID(),
    tenantId: 'admin',
    email:    ADMIN_EMAIL,
    password: hash,
    role:     'ADMIN',
  });

  console.log('✅ Admin créé avec succès');
  console.log(`   Email    : ${ADMIN_EMAIL}`);
  console.log(`   Password : ${ADMIN_PASSWORD}`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
