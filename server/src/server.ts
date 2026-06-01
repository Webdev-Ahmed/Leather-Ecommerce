import express, { type Request, type Response } from "express";
import cors from "cors";
import {
  cartRoutes,
  categoryRoutes,
  productRoutes,
  authRoutes,
} from "./routes";
import cookieParser from "cookie-parser";
import { errorHandler, notFound } from "./middleware/errorHandler";

const app = express();

// ─── Core middleware ──────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Simple request logger in development
if (process.env.NODE_ENV !== "production") {
  app.use((req: Request, _res: Response, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "Leather E-Commerce API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "development",
  });
});

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/auth", authRoutes);

// ─── Error handling ───────────────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

export default app;
