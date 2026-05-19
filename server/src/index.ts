import "dotenv/config";
import { connectDB, closeDB } from "./lib/db";
import app from "./server";

const PORT = Number(process.env.PORT) || 5000;

process.on("SIGINT", async () => {
  await closeDB();
  process.exit(0);
});

async function bootstrap(): Promise<void> {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀  Server running on http://localhost:${PORT}`);
    console.log(`    Health check → http://localhost:${PORT}/api/health`);
    console.log(`    Environment  → ${process.env.NODE_ENV ?? "development"}`);
  });
}

bootstrap();
