require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../src/models/User');

const DEMO_EMAIL = 'demo.engineer@lunas.test';

function assertSafeTarget() {
  if (process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error('Set ALLOW_DEMO_SEED=true to create the local demo account.');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo accounts cannot be seeded in production.');
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI is not configured.');

  const target = new URL(mongoUri);
  const host = target.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  const database = target.pathname.replace(/^\//, '').split('/')[0];
  if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
    throw new Error('Demo accounts may only be created in a local MongoDB instance.');
  }
  if (!['lunas_db', 'lunas_demo'].includes(database)) {
    throw new Error('Demo accounts may only be created in lunas_db or lunas_demo.');
  }
  return database;
}

async function main() {
  const database = assertSafeTarget();
  const password = process.env.DEMO_SEED_PASSWORD || 'LunasDemo2026!';
  if (password.length < 8) throw new Error('DEMO_SEED_PASSWORD must be at least 8 characters.');

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });

  let user = await User.findOne({ email: DEMO_EMAIL }).select('+password');
  if (user && user.role !== 'city_engineer') {
    throw new Error('The demo email is already used by a different role; no account was changed.');
  }

  if (!user) user = new User({ email: DEMO_EMAIL });
  user.firstName = 'City';
  user.lastName = 'Demo Engineer';
  user.phone = '09990000002';
  user.role = 'city_engineer';
  user.address = {
    street: 'City Engineering Office',
    city: 'Dagupan City',
    province: 'Pangasinan'
  };
  user.password = password;
  user.isVerified = true;
  user.isActive = true;
  await user.save();

  console.log(`Created/updated ${DEMO_EMAIL} as city_engineer in local database ${database}.`);
}

main()
  .catch(() => {
    console.error('Could not seed the local City Engineer demo account. Check the local MongoDB connection and configured demo settings.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
