import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

export interface JwtPayload {
  id: string;
  role: "user" | "admin";
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  signature?: string;
  hasCv?: boolean;
  cvFilename?: string;
}

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: "1d" });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
};