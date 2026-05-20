import type { IngestResult, Offer, OfferList, OffersQuery } from "./types";

const PUBLIC_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5001";

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    search.set(k, String(v));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${PUBLIC_API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const ct = res.headers.get("content-type") ?? "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "message" in body && (body as { message: string }).message) ||
      (body && typeof body === "object" && "error" in body && (body as { error: string }).error) ||
      `Request failed with ${res.status}`;
    const err = new Error(message as string) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return body as T;
}

interface AdminUser {
  id: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
  first_name?: string | null;
  last_name?: string | null;
}

export const api = {
  base: PUBLIC_API_BASE,

  health: () => request<{ status: string }>("/api/health"),

  register: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) =>
    request<{ token: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  login: (email: string, password: string) =>
    request<{ token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: (token: string) => request<AdminUser>("/api/me", {}, token),

  updateMe: (
    token: string,
    payload: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      signature?: string;
    },
  ) =>
    request<{ token: string }>(
      "/api/me",
      { method: "PATCH", body: JSON.stringify(payload) },
      token,
    ),

  uploadCv: (
    token: string,
    payload: { filename: string; mimetype: string; data: string },
  ) =>
    request<{ token: string }>(
      "/api/me/cv",
      { method: "POST", body: JSON.stringify(payload) },
      token,
    ),

  deleteCv: (token: string) =>
    request<{ token: string }>(
      "/api/me/cv",
      { method: "DELETE" },
      token,
    ),

  listOffers: (query: OffersQuery = {}) =>
    request<OfferList>(`/api/offers${buildQuery(query as Record<string, string | number | undefined>)}`),

  getOffer: (id: string) => request<Offer>(`/api/offers/${id}`),

  applyToOffer: (
    token: string,
    id: string,
    payload: {
      message: string;
      subject?: string;
      signature?: string;
      includeCv?: boolean;
      attachments?: { filename: string; mimetype: string; data: string }[];
    },
  ) =>
    request<{ ok: true; delivered: boolean }>(
      `/api/offers/${id}/apply`,
      { method: "POST", body: JSON.stringify(payload) },
      token,
    ),

  createOffer: (
    token: string,
    payload: {
      title: string;
      company?: string;
      location?: string;
      contract_type?: string;
      description?: string;
      salary?: string;
    },
  ) =>
    request<Offer>(
      "/api/offers",
      { method: "POST", body: JSON.stringify(payload) },
      token,
    ),

  // Admin endpoints (alignés sur backend/src/admin/admin.routes.ts)
  adminUsers: (token: string) =>
    request<AdminUser[]>("/api/admin/users", {}, token),

  adminStats: (token: string, months: number = 12) =>
    request<{
      offersTotal: number;
      companiesTotal: number;
      recentOffersCount: number;
      offersPerMonth: { key: string; count: number }[];
      contractDistribution: { type: string; count: number }[];
    }>(`/api/admin/stats?months=${months}`, {}, token),

  adminSetUserRole: (token: string, id: string, role: "user" | "admin") =>
    request<AdminUser>(
      `/api/admin/users/${id}`,
      { method: "PATCH", body: JSON.stringify({ role }) },
      token,
    ),

  adminDeleteUser: (token: string, id: string) =>
    request<{ message: string }>(
      `/api/admin/users/${id}`,
      { method: "DELETE" },
      token,
    ),

  adminDeleteOffer: (token: string, id: string) =>
    request<{ message: string }>(
      `/api/admin/offers/${id}`,
      { method: "DELETE" },
      token,
    ),

  adminModerateOffer: (
    token: string,
    id: string,
    status: "validated" | "rejected",
  ) =>
    request<{ id: string; title: string; status: string }>(
      `/api/admin/offers/${id}`,
      { method: "PATCH", body: JSON.stringify({ status }) },
      token,
    ),

  triggerIngest: (token: string) =>
    request<IngestResult>(
      "/api/admin/ingest",
      { method: "POST", body: JSON.stringify({}) },
      token,
    ),

  // Favoris (auth required, persistés sur le compte)
  getSavedOffers: (token: string) =>
    request<Offer[]>("/api/saved", {}, token),

  saveOffer: (token: string, offerId: string) =>
    request<{ saved: boolean; inserted: boolean }>(
      "/api/saved",
      { method: "POST", body: JSON.stringify({ offerId }) },
      token,
    ),

  unsaveOffer: (token: string, offerId: string) =>
    request<void>(
      `/api/saved/${offerId}`,
      { method: "DELETE" },
      token,
    ),

  migrateSavedOffers: (token: string, offerIds: string[]) =>
    request<{ inserted: number; requested: number }>(
      "/api/saved/migrate",
      { method: "POST", body: JSON.stringify({ offerIds }) },
      token,
    ),
};

export type { AdminUser };

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}
