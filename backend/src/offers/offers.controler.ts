import { Request, Response } from "express";
import { parseOffersQuery } from "./offers.dto";
import { getOffers, getOfferById, createOffer } from "./offers.service";

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

export async function postOffer(req: Request, res: Response) {
  try {
    const body = req.body as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title || title.length < 4) {
      return res.status(400).json({ error: "Le titre est requis (4+ caractÃ¨res)" });
    }
    const offer = await createOffer({
      title,
      company: typeof body.company === "string" ? body.company.trim() : null,
      location: typeof body.location === "string" ? body.location.trim() : null,
      contract_type: typeof body.contract_type === "string" ? body.contract_type.trim() : null,
      description: typeof body.description === "string" ? body.description.trim() : null,
      salary: typeof body.salary === "string" ? body.salary.trim() : null,
    });
    res.status(201).json(offer);
  } catch (err) {
    console.error("[Offers] postOffer error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
