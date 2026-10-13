import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';
import { connectDB } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server environment variables reliably from server/.env or cwd .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();



const PORT = process.env.PORT || 5000;

// Initialize server and attempt database connection
const startServer = async () => {
  // Attempt DB connection in non-blocking manner
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 SurplusLink Server running on port ${PORT}`);
    console.log(`🏥 Health check available at: http://localhost:${PORT}/api/health`);
  });
};

startServer();
