export type Role = "user" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface JwtPayload {
  id: string;
  role: Role;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  iat?: number;
  exp?: number;
}

export interface Offer {
  id: string;
  source_id?: string | null;
  title: string;
  company: string | null;
  location: string | null;
  contract_type: string | null;
  description?: string | null;
  salary: string | null;
  source?: string | null;
  published_at: string | null;
  created_at?: string | null;
}

export interface OfferList {
  data: Offer[];
  total: number;
  page: number;
  size: number;
}

export interface OffersQuery {
  q?: string;
  location?: string;
  contract_type?: string;
  page?: number;
  size?: number;
}

export interface IngestResult {
  success: boolean;
  total?: number;
  inserted?: number;
  skipped?: number;
  error?: string;
}
