import { Router } from "express";
import { listOffers, getOffer } from "../offers/offers.controler";

const router = Router();

router.get("/", listOffers);
router.get("/:id", getOffer);

export default router;