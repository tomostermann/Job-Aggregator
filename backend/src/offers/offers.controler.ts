import { Request, Response } from "express";
import { parseOffersQuery } from "./offers.dto";
import { getOffers, getOfferById } from "./offers.service";

export async function listOffers(req: Request, res: Response) {
  try {
    const filters = parseOffersQuery(req.query as Record<string, unknown>);
    const result = await getOffers(filters);
    res.status(200).json(result);
  } catch (err) {
    console.error("[Offers] listOffers error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getOffer(req: Request, res: Response) {
  try {
    const id = req.params.id as string; 
    const offer = await getOfferById(id);

    if (!offer) {
      res.status(404).json({ error: "Offer not found" });
      return;
    }

    res.status(200).json(offer);
  } catch (err) {
    console.error("[Offers] getOffer error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}