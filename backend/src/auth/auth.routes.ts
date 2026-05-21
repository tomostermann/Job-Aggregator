import { Router } from "express";
import {
  registerController,
  loginController,
  logoutController,
} from "./auth.controller";
import { authLimiter } from "../middlewares/limit.middleware";

const router = Router();

router.post("/register", authLimiter, registerController);
router.post("/login", authLimiter, loginController);
router.post("/logout", logoutController);

export default router;
