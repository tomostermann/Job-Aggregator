import pool from "../config/db";
import { OffersQuery } from "./offers.dto";

export async function getOffers(filters: OffersQuery) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (filters.location) {
    conditions.push(`location ILIKE $${i++}`);
    values.push(`%${filters.location}%`);
  }
  if (filters.contract_type) {
    conditions.push(`contract_type ILIKE $${i++}`);
    values.push(`%${filters.contract_type}%`);
  }
  if (filters.q) {
    conditions.push(`(title ILIKE $${i} OR description ILIKE $${i++})`);
    values.push(`%${filters.q}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (filters.page ?? 0) * (filters.size ?? 20);

  values.push(filters.size ?? 20);
  values.push(offset);

  const dataQuery = `
    SELECT id, title, company, location, contract_type, salary, published_at
    FROM offers
    ${where}
    ORDER BY published_at DESC NULLS LAST
    LIMIT $${i++} OFFSET $${i++}
  `;

  const countQuery = `SELECT COUNT(*) FROM offers ${where}`;

  const [data, count] = await Promise.all([
    pool.query(dataQuery, values),
    pool.query(countQuery, values.slice(0, -2)),
  ]);

  return {
    data: data.rows,
    total: parseInt(count.rows[0].count),
    page: filters.page ?? 0,
    size: filters.size ?? 20,
  };
}

export async function getOfferById(id: string) {
  const result = await pool.query(
    `SELECT * FROM offers WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export interface CreateOfferInput {
  title: string;
  company: string | null;
  location: string | null;
  contract_type: string | null;
  description: string | null;
  salary: string | null;
}

export async function createOffer(input: CreateOfferInput) {
  const sourceId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const result = await pool.query(
    `INSERT INTO offers (source_id, title, company, location, contract_type, description, salary, source, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'user', NOW())
     RETURNING *`,
    [
      sourceId,
      input.title,
      input.company,
      input.location,
      input.contract_type,
      input.description,
      input.salary,
    ],
  );
  return result.rows[0];
}