import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

/**
 * Connect to MongoDB database instance (Atlas or Local).
 * Designed to gracefully handle missing connections during initial setup
 * without crashing the server scaffolding.
 */
export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn('⚠️  MONGODB_URI is not set in environment variables. Database connection skipped.');
    return false;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000 // Quick timeout to prevent hanging if DB is offline
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    // If localhost failed on Node due to IPv6 resolution, attempt 127.0.0.1
    if (mongoUri.includes('localhost')) {
      const fallbackUri = mongoUri.replace('localhost', '127.0.0.1');
      try {
        const conn = await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 5000
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return true;
      } catch (fallbackErr) {
        // Fall through to error reporting
      }
    }
    console.warn(`⚠️  MongoDB connection error: ${error.message}`);
    console.warn('ℹ️  The server will continue running in scaffolding mode without database connectivity.');
    return false;
  }
};

export default connectDB;
