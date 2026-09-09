import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// Ensure SRV records can be resolved reliably on Windows
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore if unable to set custom DNS
}

function getSafeMongoUri(rawUri: string): string {
  let uri = rawUri.trim();
  // Handle unencoded special characters like '@' in passwords:
  // e.g. mongodb+srv://username:password@123@cluster0...
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.*)@([^@/]+)(\/.*)?$/);
  if (match) {
    const [, proto, user, pass, host, rest = ''] = match;
    const encodedPass = encodeURIComponent(decodeURIComponent(pass));
    return `${proto}${user}:${encodedPass}@${host}${rest}`;
  }
  return uri;
}

export const connectDB = async () => {
  const rawUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/reachinbox';
  const uri = getSafeMongoUri(rawUri);
  try {
    await mongoose.connect(uri, {
      dbName: 'reachinbox',
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[MongoDB] Connected successfully to database: reachinbox`);
  } catch (err: any) {
    console.error('[MongoDB] Connection error:', err.message);
    // Retry after 5 seconds
    console.log('[MongoDB] Retrying connection in 5 seconds...');
    setTimeout(() => connectDB(), 5000);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected from database.');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Connection error:', err.message);
});
