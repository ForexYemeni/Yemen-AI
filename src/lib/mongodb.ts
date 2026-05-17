// MongoDB Connection - اتصال قاعدة بيانات MongoDB
// يعمل مع MongoDB Atlas (سحابي) ومثيلات MongoDB المحلية

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yemen-ai';

if (!MONGODB_URI) {
  throw new Error(
    'يرجى تعريف متغير MONGODB_URI في ملف .env أو إعدادات Vercel'
  );
}

// Cache the connection on the global object in development
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('[MongoDB] تم الاتصال بنجاح');
      return mongoose;
    }).catch((error) => {
      console.error('[MongoDB] فشل الاتصال:', error.message);
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
