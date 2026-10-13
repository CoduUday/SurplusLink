import mongoose from 'mongoose';

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
    console.warn(`⚠️  MongoDB connection error: ${error.message}`);
    console.warn('ℹ️  The server will continue running in scaffolding mode without database connectivity.');
    return false;
  }
};

export default connectDB;
