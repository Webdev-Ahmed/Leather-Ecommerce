import "dotenv/config";
import express, { type Request, type Response } from "express";
import cors from "cors";
import {
  cartRoutes,
  categoryRoutes,
  productRoutes,
  authRoutes,
  orderRoutes,
  addressRoutes,
  payfastRoutes,
  jazzcashRoutes,
  easypaisaRoutes,
  newsletterRoutes,
  userRoutes,
} from "./routes";
import cookieParser from "cookie-parser";
import { errorHandler, notFound } from "./middleware/errorHandler";

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowed = [
      "http://localhost:5173",
      "http://localhost:3001",
      "http://localhost:3002",
      process.env.FRONTEND_URL,
    ].filter(Boolean) as string[];

    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// ─── Core middleware ──────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/payments", payfastRoutes);
app.use("/api/payments/jazzcash", jazzcashRoutes);
app.use("/api/payments/easypaisa", easypaisaRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/users", userRoutes);

// ─── Error handling ───────────────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

export default app;
