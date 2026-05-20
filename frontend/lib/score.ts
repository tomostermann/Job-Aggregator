import type { Offer } from "./types";

const DEFAULT_KEYWORDS = [
  "react",
  "typescript",
  "node",
  "python",
  "docker",
  "kubernetes",
  "ai",
  "ml",
  "data",
  "cloud",
  "fullstack",
  "frontend",
  "backend",
  "stage",
  "alternance",
];

function hashSeed(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function computeOfferScore(offer: Offer, keywords: string[] = DEFAULT_KEYWORDS): number {
  const text = `${offer.title} ${offer.description ?? ""} ${offer.contract_type ?? ""}`.toLowerCase();
  const matches = keywords.filter((k) => text.includes(k)).length;
  const keywordScore = Math.min(40, matches * 6);

  const hasSalary = offer.salary ? 12 : 0;
  const hasDescription = offer.description && offer.description.length > 200 ? 12 : 4;
  const hasContractType = offer.contract_type ? 8 : 0;
  const hasLocation = offer.location ? 5 : 0;

  const recencyBoost = (() => {
    if (!offer.published_at) return 5;
    const days = (Date.now() - new Date(offer.published_at).getTime()) / 86400000;
    if (Number.isNaN(days)) return 5;
    if (days < 7) return 18;
    if (days < 30) return 12;
    if (days < 60) return 8;
    return 3;
  })();

  const jitter = hashSeed(offer.id) % 6;
  const total = keywordScore + hasSalary + hasDescription + hasContractType + hasLocation + recencyBoost + jitter;
  return Math.min(99, Math.max(35, total));
}

export function isGhostJob(offer: Offer): boolean {
  if (!offer.published_at) return false;
  const days = (Date.now() - new Date(offer.published_at).getTime()) / 86400000;
  return days > 60;
}

export function extractTags(offer: Offer): string[] {
  const TECH = [
    "React", "TypeScript", "JavaScript", "Node.js", "Python", "Java", "Go", "Rust",
    "Docker", "Kubernetes", "AWS", "GCP", "Azure", "PostgreSQL", "MongoDB", "Redis",
    "Next.js", "Vue", "Angular", "Django", "Rails", "Spring", "GraphQL", "REST",
    "CI/CD", "DevOps", "Linux", "Bash", "Terraform", "Ansible", "Kafka",
  ];
  const text = `${offer.title} ${offer.description ?? ""}`;
  const lower = text.toLowerCase();
  const tags = TECH.filter((t) => lower.includes(t.toLowerCase()));
  return tags.slice(0, 4);
}

export function summarizeOffer(offer: Offer): string {
  const parts: string[] = [];
  if (offer.contract_type) parts.push(offer.contract_type);
  if (offer.location) parts.push(offer.location);
  if (offer.company) parts.push(`@${offer.company}`);
  const tags = extractTags(offer);
  const tagPart = tags.length ? ` Stack: ${tags.join(", ")}.` : "";
  return `${parts.join(" · ")}.${tagPart} ${offer.salary ? `Rémunération: ${offer.salary}.` : ""}`.trim();
}
