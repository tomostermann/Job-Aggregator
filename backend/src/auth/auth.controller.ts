import { Request, Response } from "express";
import { register, login } from "./auth.service";

export const registerController = async (req: Request, res: Response) => {
  try {
    const result = await register(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const result = await login(req.body);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const logoutController = (_req: Request, res: Response) => {
  res.status(200).json({ message: "Logged out" });
};
