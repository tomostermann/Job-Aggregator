import { Request, Response } from "express";
import {
  getSavedOffers,
  addSavedOffer,
  removeSavedOffer,
  addSavedOffersBatch,
} from "./saved.service";

type AuthedRequest = Request & { user?: { id: string } };

const isUuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export const getSavedController = async (req: AuthedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthenticated" });
    const offers = await getSavedOffers(user.id);
    res.status(200).json(offers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addSavedController = async (req: AuthedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthenticated" });
    const { offerId } = req.body as { offerId?: string };
    if (!isUuid(offerId)) {
      return res.status(400).json({ message: "offerId invalide" });
    }
    const inserted = await addSavedOffer(user.id, offerId);
    res.status(inserted ? 201 : 200).json({ saved: true, inserted });
  } catch (error: any) {
    if (error.message === "Offer not found") {
      return res.status(404).json({ message: "Offre introuvable" });
    }
    res.status(500).json({ message: error.message });
  }
};

export const removeSavedController = async (
  req: AuthedRequest,
  res: Response,
) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthenticated" });
    const { offerId } = req.params;
    if (!isUuid(offerId)) {
      return res.status(400).json({ message: "offerId invalide" });
    }
    await removeSavedOffer(user.id, offerId);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const migrateSavedController = async (
  req: AuthedRequest,
  res: Response,
) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthenticated" });
    const { offerIds } = req.body as { offerIds?: unknown };
    if (!Array.isArray(offerIds)) {
      return res.status(400).json({ message: "offerIds doit Ãªtre un tableau" });
    }
    const valid = offerIds.filter(isUuid);
    const inserted = await addSavedOffersBatch(user.id, valid);
    res.status(200).json({ inserted, requested: valid.length });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};