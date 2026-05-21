import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  getSavedController,
  addSavedController,
  removeSavedController,
  migrateSavedController,
} from "./saved.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", getSavedController);
router.post("/", addSavedController);
router.post("/migrate", migrateSavedController);
router.delete("/:offerId", removeSavedController);

export default router;