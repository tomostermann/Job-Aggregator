import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import initDb from "./config/initDb";
import ingestRouter from "./routes/ingest";

dotenv.config();
initDb();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/admin/ingest", ingestRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
