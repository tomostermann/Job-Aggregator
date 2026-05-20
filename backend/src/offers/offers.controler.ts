import { Request, Response } from "express";
import { parseOffersQuery } from "./offers.dto";
import {
  getOffers,
  getOfferById,
  createOffer,
  getOfferRecruiter,
} from "./offers.service";
import { sendMail } from "../utils/mail";

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
      return res.status(400).json({ error: "Le titre est requis (4+ caractères)" });
    }
    const userId = (req as any).user?.id ?? null;
    const offer = await createOffer({
      title,
      company: typeof body.company === "string" ? body.company.trim() : null,
      location: typeof body.location === "string" ? body.location.trim() : null,
      contract_type: typeof body.contract_type === "string" ? body.contract_type.trim() : null,
      description: typeof body.description === "string" ? body.description.trim() : null,
      salary: typeof body.salary === "string" ? body.salary.trim() : null,
      createdBy: userId,
    });
    res.status(201).json(offer);
  } catch (err) {
    console.error("[Offers] postOffer error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function applyToOffer(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const user = (req as any).user as {
      id: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    } | undefined;

    if (!user?.email) {
      return res.status(401).json({ error: "Authentification requise" });
    }

    const recruiter = await getOfferRecruiter(id);
    if (!recruiter) {
      return res.status(400).json({
        error:
          "Cette offre n'a pas de recruteur joignable (offre importée d'une source externe).",
      });
    }

    const body = req.body as Record<string, unknown>;
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (message.length === 0) {
      return res.status(400).json({ error: "Le message de candidature est requis" });
    }
    if (message.length > 5000) {
      return res.status(400).json({ error: "Le message est trop long (max 5000 caractères)" });
    }

    const candidateName =
      [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
    const subject = `Candidature — ${recruiter.offerTitle}${
      recruiter.offerCompany ? ` (${recruiter.offerCompany})` : ""
    }`;

    const signatureLines = [
      "—",
      candidateName,
      user.email,
      user.phone ? `Tél : ${user.phone}` : null,
    ].filter(Boolean) as string[];

    const text = `${message}\n\n${signatureLines.join("\n")}`;

    const result = await sendMail({
      to: recruiter.email,
      replyTo: user.email,
      subject,
      text,
    });

    res.status(200).json({ ok: true, delivered: result.delivered });
  } catch (err) {
    console.error("[Offers] applyToOffer error:", err);
    res.status(500).json({ error: "Erreur lors de l'envoi du mail" });
  }
}