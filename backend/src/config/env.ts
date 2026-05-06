import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const ENV = {
  JWT_SECRET: process.env.JWT_SECRET ?? "changeme",
  PORT: Number(process.env.PORT) || 3000,
};
