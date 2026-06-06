import { MongoClient } from 'mongodb';
import { config } from './index.js';

/**
 * MongoDB connection helper, designed for serverless (Vercel) where the same
 * Node instance is reused across invocations ("warm starts"). We cache the
 * connecting client promise on globalThis so we never open more than one pool
 * per instance.
 *
 * Set MONGODB_URI to your MongoDB Atlas connection string. The models talk to
 * a tiny Mongoose-like ODM (src/db/odm.js) so controllers stay unchanged.
 */

function makeClient() {
  if (!config.mongoUri) {
    throw new Error(
      'MONGODB_URI is not set. Provide a MongoDB connection string (e.g. from MongoDB Atlas).'
    );
  }
  return new MongoClient(config.mongoUri, { maxPoolSize: 10 });
}

let clientPromise = globalThis.__brokerMongoClient || null;

export function getClientPromise() {
  if (!clientPromise) {
    clientPromise = makeClient().connect();
    globalThis.__brokerMongoClient = clientPromise;
  }
  return clientPromise;
}

export async function getDb() {
  const client = await getClientPromise();
  return client.db(config.mongoDb);
}

export async function connectDB() {
  await getClientPromise();
  console.log(`[db] Connected to MongoDB database "${config.mongoDb}"`);
  return getDb();
}

export async function disconnectDB() {
  if (clientPromise) {
    const client = await clientPromise;
    await client.close();
    clientPromise = null;
    globalThis.__brokerMongoClient = null;
  }
}
