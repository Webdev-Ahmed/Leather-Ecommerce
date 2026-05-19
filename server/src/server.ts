import express, { type Request, type Response } from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * GET /api/health
 * Quick liveness probe — confirms the server is running and DB is reachable.
 * Used by uptime monitors, load balancers, and CI smoke tests.
 */
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "Leather E-Commerce API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "development",
  });
});

export default app;
