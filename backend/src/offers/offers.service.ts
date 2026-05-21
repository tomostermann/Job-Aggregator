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
    // Supporte plusieurs types séparés par des virgules (ex: "Alternance,Stage")
    const types = filters.contract_type
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (types.length === 1) {
      conditions.push(`contract_type ILIKE $${i++}`);
      values.push(`%${types[0]}%`);
    } else if (types.length > 1) {
      const orClauses = types.map(() => `contract_type ILIKE $${i++}`);
      conditions.push(`(${orClauses.join(" OR ")})`);
      for (const t of types) values.push(`%${t}%`);
    }
  }
  if (filters.q) {
    conditions.push(
      `(title ILIKE $${i} OR description ILIKE $${i} OR contract_type ILIKE $${i} OR company ILIKE $${i++})`,
    );
    values.push(`%${filters.q}%`);
  }
  if (filters.status === "ghost") {
    conditions.push(
      `published_at IS NOT NULL AND published_at < NOW() - INTERVAL '60 days'`,
    );
  } else if (filters.status === "fresh") {
    conditions.push(
      `published_at IS NOT NULL AND published_at >= NOW() - INTERVAL '7 days'`,
    );
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
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
    `SELECT o.*, u.email AS recruiter_email,
            u.first_name AS recruiter_first_name,
            u.last_name AS recruiter_last_name
     FROM offers o
     LEFT JOIN users u ON u.id = o.created_by
     WHERE o.id = $1`,
    [id],
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
  createdBy: string | null;
}

export async function createOffer(input: CreateOfferInput) {
  const sourceId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const result = await pool.query(
    `INSERT INTO offers (source_id, title, company, location, contract_type, description, salary, source, created_by, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'user', $8, NOW())
     RETURNING *`,
    [
      sourceId,
      input.title,
      input.company,
      input.location,
      input.contract_type,
      input.description,
      input.salary,
      input.createdBy,
    ],
  );
  return result.rows[0];
}

export async function getOfferRecruiter(id: string): Promise<{
  email: string;
  firstName: string | null;
  lastName: string | null;
  offerTitle: string;
  offerCompany: string | null;
} | null> {
  const result = await pool.query(
    `SELECT u.email, u.first_name, u.last_name, o.title, o.company
     FROM offers o
     INNER JOIN users u ON u.id = o.created_by
     WHERE o.id = $1`,
    [id],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    email: row.email,
    firstName: row.first_name ?? null,
    lastName: row.last_name ?? null,
    offerTitle: row.title,
    offerCompany: row.company ?? null,
  };
}
