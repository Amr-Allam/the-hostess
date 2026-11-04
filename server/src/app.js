import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import reservationRoutes from "./routes/reservationRoutes.js";

const app = express();

// Behind Render's proxy: use the real client IP (needed for rate limiting).
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/staff", staffRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
