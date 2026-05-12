import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import initDb from "./config/initDb";
import authRoutes from "./auth/auth.routes";
import ingestRouter from "./routes/ingest";
import offersRouter from "./routes/offers";
import adminRouter, { meRouter } from "./admin/admin.routes";
import { authMiddleware } from "./middlewares/auth.middleware";
import { roleMiddleware } from "./middlewares/role.middleware";
import { errorMiddleware } from "./middlewares/error.middleware";

dotenv.config();
initDb();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/me", meRouter);
app.use("/api/offers", offersRouter);
app.use("/api/admin/ingest", authMiddleware as never, roleMiddleware("admin") as never, ingestRouter);
app.use("/api/admin", adminRouter);

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
