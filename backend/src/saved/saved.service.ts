import pool from "../config/db";

export const getSavedOffers = async (userId: string) => {
  const result = await pool.query(
    `SELECT o.*, s.saved_at
     FROM saved_offers s
     JOIN offers o ON o.id = s.offer_id
     WHERE s.user_id = $1
     ORDER BY s.saved_at DESC`,
    [userId],
  );
  return result.rows;
};

export const addSavedOffer = async (userId: string, offerId: string) => {
  const offer = await pool.query("SELECT id FROM offers WHERE id = $1", [
    offerId,
  ]);
  if (offer.rows.length === 0) throw new Error("Offer not found");

  const result = await pool.query(
    `INSERT INTO saved_offers (user_id, offer_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, offer_id) DO NOTHING`,
    [userId, offerId],
  );
  return (result.rowCount ?? 0) > 0;
};

export const removeSavedOffer = async (userId: string, offerId: string) => {
  const result = await pool.query(
    `DELETE FROM saved_offers WHERE user_id = $1 AND offer_id = $2`,
    [userId, offerId],
  );
  return (result.rowCount ?? 0) > 0;
};

export const addSavedOffersBatch = async (
  userId: string,
  offerIds: string[],
) => {
  if (offerIds.length === 0) return 0;

  const existing = await pool.query(
    "SELECT id FROM offers WHERE id = ANY($1::uuid[])",
    [offerIds],
  );
  const validIds = existing.rows.map((r) => r.id as string);
  if (validIds.length === 0) return 0;

  const placeholders = validIds.map((_, i) => `($1, $${i + 2})`).join(", ");
  const result = await pool.query(
    `INSERT INTO saved_offers (user_id, offer_id)
     VALUES ${placeholders}
     ON CONFLICT (user_id, offer_id) DO NOTHING`,
    [userId, ...validIds],
  );
  return result.rowCount ?? 0;
};