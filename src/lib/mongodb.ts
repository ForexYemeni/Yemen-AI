// MongoDB Connection - اتصال قاعدة بيانات MongoDB
// يعمل مع MongoDB Atlas (سحابي) ومثيلات MongoDB المحلية
// إذا لم يكن MONGODB_URI متوفراً، يعمل النظام بدون قاعدة بيانات (وضع العرض فقط)

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

// Cache the connection on the global object in development
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null, failed: false };
}

// Check if MongoDB is configured
export function isMongoConfigured(): boolean {
  return !!MONGODB_URI;
}

async function dbConnect(): Promise<typeof mongoose | null> {
  // If no URI, return null (demo mode)
  if (!MONGODB_URI) {
    console.warn('[MongoDB] لم يتم تعريف MONGODB_URI - النظام يعمل بدون قاعدة بيانات');
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  // If previously failed, don't keep retrying on every request
  if (cached.failed) {
    return null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('[MongoDB] تم الاتصال بنجاح');
      cached.failed = false;
      return mongoose;
    }).catch((error) => {
      console.error('[MongoDB] فشل الاتصال:', error.message);
      cached.promise = null;
      cached.failed = true;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    return null;
  }

  return cached.conn;
}

export default dbConnect;
