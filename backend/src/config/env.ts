import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const ENV = {
  JWT_SECRET: process.env.JWT_SECRET ?? "changeme",
  PORT: Number(process.env.PORT) || 3000,
  SMTP_HOST: process.env.SMTP_HOST ?? "",
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER ?? "",
  SMTP_PASS: process.env.SMTP_PASS ?? "",
  SMTP_FROM: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@jobaggregator.local",
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
};