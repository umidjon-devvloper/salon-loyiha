import mongoose from 'mongoose';
import env from './env.js';

mongoose.set('strictQuery', true);

// `lean()` natijalarida _id ni stringga aylantirmaymiz — controller qatlami hal qiladi.
if (env.isDev) {
  mongoose.set('debug', false); // kerak bo'lsa true qiling
}

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 10_000,
      maxPoolSize: 20,
    });
    const { host, name } = mongoose.connection;
    console.log(`✅ MongoDB ulandi: ${host}/${name}`);
  } catch (err) {
    console.error('❌ MongoDB ulanmadi:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB xatosi:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB uzildi');
  });
}

export async function disconnectDB() {
  await mongoose.connection.close();
  console.log('🔌 MongoDB ulanishi yopildi');
}

export default connectDB;
