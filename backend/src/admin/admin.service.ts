import pool from "../config/db";

export const getAllUsers = async () => {
  const result = await pool.query(
    "SELECT id, email, role, created_at FROM users ORDER BY created_at DESC",
  );
  return result.rows;
};

export const updateUserRole = async (id: string, role: "user" | "admin") => {
  const result = await pool.query(
    "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role",
    [role, id],
  );
  if (result.rows.length === 0) throw new Error("User not found");
  return result.rows[0];
};

export const deleteUser = async (id: string) => {
  const result = await pool.query(
    "DELETE FROM users WHERE id = $1 RETURNING id, email",
    [id],
  );
  if (result.rows.length === 0) throw new Error("User not found");
  return result.rows[0];
};

export const deleteOffer = async (id: string) => {
  const result = await pool.query(
    "DELETE FROM offers WHERE id = $1 RETURNING id",
    [id],
  );
  if (result.rows.length === 0) throw new Error("Offer not found");
};

export const moderateOffer = async (
  id: string,
  status: "validated" | "rejected",
) => {
  const result = await pool.query(
    "UPDATE offers SET status = $1 WHERE id = $2 RETURNING id, title, status",
    [status, id],
  );
  if (result.rows.length === 0) throw new Error("Offer not found");
  return result.rows[0];
};

export interface AdminStats {
  offersTotal: number;
  companiesTotal: number;
  recentOffersCount: number;
  offersPerMonth: { key: string; count: number }[];
  contractDistribution: { type: string; count: number }[];
}

export const getAdminStats = async (
  monthsBack: number = 12,
): Promise<AdminStats> => {
  const months = Math.max(1, Math.min(36, Math.floor(monthsBack)));

  const [totals, perMonth, contracts] = await Promise.all([
    pool.query(`
      SELECT
        (SELECT COUNT(*) FROM offers) AS offers_total,
        (SELECT COUNT(DISTINCT company) FROM offers WHERE company IS NOT NULL AND company != '') AS companies_total,
        (SELECT COUNT(*) FROM offers
           WHERE published_at IS NOT NULL
             AND published_at >= NOW() - INTERVAL '7 days') AS recent_offers
    `),
    pool.query(
      `
      WITH months AS (
        SELECT TO_CHAR(date_trunc('month', NOW()) - (n || ' months')::interval, 'YYYY-MM') AS key
        FROM generate_series(0, $1::int - 1) AS n
      )
      SELECT m.key,
             COALESCE(c.count, 0)::int AS count
      FROM months m
      LEFT JOIN (
        SELECT TO_CHAR(date_trunc('month', published_at), 'YYYY-MM') AS key,
               COUNT(*) AS count
        FROM offers
        WHERE published_at IS NOT NULL
        GROUP BY 1
      ) c ON c.key = m.key
      ORDER BY m.key ASC
      `,
      [months],
    ),
    pool.query(`
      SELECT TRIM(split_part(contract_type, ',', 1)) AS type,
             COUNT(*)::int AS count
      FROM offers
      WHERE contract_type IS NOT NULL
        AND TRIM(contract_type) != ''
      GROUP BY TRIM(split_part(contract_type, ',', 1))
      HAVING TRIM(split_part(contract_type, ',', 1)) != ''
      ORDER BY count DESC
      LIMIT 10
    `),
  ]);

  const t = totals.rows[0];
  return {
    offersTotal: Number(t.offers_total) || 0,
    companiesTotal: Number(t.companies_total) || 0,
    recentOffersCount: Number(t.recent_offers) || 0,
    offersPerMonth: perMonth.rows.map((r) => ({
      key: r.key,
      count: Number(r.count) || 0,
    })),
    contractDistribution: contracts.rows.map((r) => ({
      type: r.type,
      count: Number(r.count) || 0,
    })),
  };
};
