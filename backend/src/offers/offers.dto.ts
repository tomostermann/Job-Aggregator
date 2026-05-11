export interface OffersQuery {
  location?: string;
  contract_type?: string;
  salary?: string;
  page?: number;
  size?: number;
  q?: string;
}

export function parseOffersQuery(query: Record<string, unknown>): OffersQuery {
  return {
    location: query.location as string | undefined,
    contract_type: query.contract_type as string | undefined,
    salary: query.salary as string | undefined,
    q: query.q as string | undefined,
    page: query.page ? Math.max(0, parseInt(query.page as string)) : 0,
    size: query.size ? Math.min(100, parseInt(query.size as string)) : 20,
  };
}