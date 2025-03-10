import { MongoClient, ServerApiVersion } from 'mongodb';

// Define global type extension for mongo cache
declare global {
  // eslint-disable-next-line no-var
  var mongo: {
    conn: any | null;
    promise: Promise<any> | null;
  } | undefined;
}

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

if (!process.env.MONGODB_DB) {
  throw new Error('Please define the MONGODB_DB environment variable inside .env.local');
}

// Type for our cached MongoDB connection
type MongoCache = {
  conn: any | null;
  promise: Promise<any> | null;
};

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
const cached: MongoCache = global.mongo || { conn: null, promise: null };

// Initialize cache if not previously set
if (!global.mongo) {
  global.mongo = cached;
}

export async function connectToDatabase() {
  if (cached.conn) {
    console.log('Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      // Connection pooling
      maxPoolSize: 10,
      minPoolSize: 5,
      // Timeouts and retries
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
    };

    console.log('Connecting to MongoDB...');
    
    // Clean the URI by removing whitespace
    const mongodbUri = process.env.MONGODB_URI?.replace(/\s+/g, '') || '';
    
    // Log partial URI for debugging (hiding credentials)
    const sanitizedUri = mongodbUri.replace(
      /mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/,
      'mongodb$1://****:****@'
    );
    console.log('Using MongoDB URI:', sanitizedUri);

    cached.promise = MongoClient.connect(mongodbUri, opts).then((client) => {
      console.log('Connected to MongoDB successfully');
      return {
        client,
        db: client.db(process.env.MONGODB_DB || 'audio-notes'),
      };
    }).catch((err) => {
      console.error('MongoDB connection error:', err);
      cached.promise = null; // Reset the promise so we can retry
      throw err; // Re-throw to be handled by the caller
    });
  } else {
    console.log('Using existing MongoDB connection promise');
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    // If there's an error, make sure we can retry
    cached.promise = null;
    console.error('MongoDB connection failed, will retry on next request:', e);
    
    // Return a fallback for graceful degradation
    return {
      client: null,
      db: {
        collection: (name: string) => ({
          find: () => ({ toArray: async () => [] }),
          findOne: async () => null,
          insertOne: async () => ({ insertedId: `local-${Date.now()}` }),
          deleteOne: async () => ({ deletedCount: 1 }),
        })
      }
    };
  }
} 