import "dotenv/config";
import { prisma } from "./lib/db";

const PORT = Number(process.env.PORT) || 5000;

async function bootstrap(): Promise<void> {
  const { default: app } = await import("./server");

  app.listen(PORT, () => {
    console.log(`🚀  Server running on http://localhost:${PORT}`);
    console.log(`    Health check → http://localhost:${PORT}/api/health`);
    console.log(`    Environment  → ${process.env.NODE_ENV ?? "development"}`);
  });

  setInterval(
    async () => {
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch {}
    },
    4 * 60 * 1000,
  );
}

bootstrap();
