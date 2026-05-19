import "dotenv/config";
import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const MONGO_URL = process.env.MONGO_URL;

  if (!MONGO_URL) {
    console.error("❌  MONGO_URL is not defined in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("✅  MongoDB Atlas connected successfully");
    console.log(`    DB: ${mongoose.connection.db?.databaseName}`);
  } catch (error) {
    console.error("❌  MongoDB connection failed:", (error as Error).message);
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️   MongoDB disconnected");
  });
}

export async function closeDB(): Promise<void> {
  await mongoose.connection.close();
  console.log("🔌  MongoDB connection closed");
}
