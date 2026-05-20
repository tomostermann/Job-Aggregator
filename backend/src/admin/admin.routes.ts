import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import {
  getUsersController,
  updateUserRoleController,
  deleteUserController,
  deleteOfferController,
  moderateOfferController,
  getStatsController,
} from "./admin.controller";
import {
  updateProfile,
  setUserCv,
  deleteUserCv,
  getUserCv,
} from "../auth/auth.service";

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware("admin"));

router.get("/users", getUsersController);
router.patch("/users/:id", updateUserRoleController);
router.delete("/users/:id", deleteUserController);
router.delete("/offers/:id", deleteOfferController);
router.patch("/offers/:id", moderateOfferController);
router.get("/stats", getStatsController);

export const meRouter = Router();

meRouter.use(authMiddleware);
meRouter.get("/", (req: Request, res: Response) => {
  res.status(200).json((req as any).user);
});

meRouter.patch("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) return res.status(401).json({ message: "Non authentifié" });
    const { firstName, lastName, phone, signature } = req.body ?? {};
    const result = await updateProfile(userId, {
      firstName,
      lastName,
      phone,
      signature,
    });
    res.status(200).json(result);
  } catch (err) {
    res
      .status(400)
      .json({ message: err instanceof Error ? err.message : "Erreur" });
  }
});

meRouter.post("/cv", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) return res.status(401).json({ message: "Non authentifié" });
    const { filename, mimetype, data } = req.body ?? {};
    if (
      typeof filename !== "string" ||
      typeof mimetype !== "string" ||
      typeof data !== "string"
    ) {
      return res.status(400).json({ message: "filename, mimetype, data (base64) requis" });
    }
    const buf = Buffer.from(data, "base64");
    if (buf.length === 0) {
      return res.status(400).json({ message: "Fichier vide ou base64 invalide" });
    }
    const result = await setUserCv(userId, filename, mimetype, buf);
    res.status(200).json(result);
  } catch (err) {
    res
      .status(400)
      .json({ message: err instanceof Error ? err.message : "Erreur" });
  }
});

meRouter.delete("/cv", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) return res.status(401).json({ message: "Non authentifié" });
    const result = await deleteUserCv(userId);
    res.status(200).json(result);
  } catch (err) {
    res
      .status(400)
      .json({ message: err instanceof Error ? err.message : "Erreur" });
  }
});

meRouter.get("/cv", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) return res.status(401).json({ message: "Non authentifié" });
    const cv = await getUserCv(userId);
    if (!cv) return res.status(404).json({ message: "Aucun CV enregistré" });
    res.setHeader("Content-Type", cv.mimetype);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(cv.filename)}"`,
    );
    res.send(cv.data);
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Erreur" });
  }
});

export default router;
