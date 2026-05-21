export function formatRelativeDate(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const diff = Date.now() - date.getTime();
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(diff / day);
  if (days < 1) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `il y a ${days} j`;
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem`;
  if (days < 365) return `il y a ${Math.floor(days / 30)} mois`;
  return `il y a ${Math.floor(days / 365)} an${Math.floor(days / 365) > 1 ? "s" : ""}`;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function initialsOf(value?: string | null): string {
  if (!value) return "??";
  const parts = value.split(/[\s.@_-]+/).filter(Boolean);
  const letters =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`
      : parts[0]?.slice(0, 2) ?? "??";
  return letters.toUpperCase();
}

export function colorFromString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  const palette = [
    "#0A2EFF",
    "#3D5AFE",
    "#FF5733",
    "#14B8A6",
    "#7C3AED",
    "#F59E0B",
    "#0EA5E9",
    "#EC4899",
  ];
  return palette[Math.abs(hash) % palette.length];
}

export function truncate(text: string, max = 180): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

/**
 * Si le salaire est une plage où les deux bornes sont identiques
 * (ex. "1 - 1 k€/an"), renvoie une version dédupliquée ("1 k€/an").
 * Sinon, renvoie la chaîne d'origine.
 */
export function formatSalary(salary: string | null | undefined): string {
  if (!salary) return "";
  const m = salary.match(/^\s*(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)(\s*.*)$/);
  if (!m) return salary;
  const [, a, b, rest] = m;
  if (a !== b) return salary;
  return `${a}${rest}`.trim();
}

/**
 * Renvoie le meilleur libellé identifiant l'utilisateur :
 * "Prénom Nom" si disponibles, sinon prénom seul, sinon email, sinon "candidat".
 */
export function displayUserName(user: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
} | null | undefined): string {
  if (!user) return "candidat";
  const first = user.firstName?.trim();
  const last = user.lastName?.trim();
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (user.email) return user.email.split("@")[0];
  return "candidat";
}
