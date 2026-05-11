import { Router } from "express";
import { listOffers, getOffer, postOffer } from "../offers/offers.controler";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", listOffers);
router.get("/:id", getOffer);
router.post("/", authMiddleware as never, postOffer as never);

export default router;