// Supprime les balises HTML
function stripHtml(str) {
  if (!str) return "";
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const CONTRACT_TYPE_MAP = {
  internship: "Stage",
  apprenticeship: "Alternance",
  fixedTerm: "CDD",
  freelance: "Freelance",
  permanent: "CDI",
  spontaneous: "Candidature spontanée",
};

function translateContractType(raw) {
  return CONTRACT_TYPE_MAP[raw] || raw;
}

/**
 * Normalise une offre brute WeLoveDevs
 *
 * Structure de l'API :
 * JOB :
 *   - id / objectID         → identifiant unique
 *   - title                 → titre du poste
 *   - description           → description
 *   - smallCompany.companyName → nom de l'entreprise
 *   - formattedPlaces       → localisation formatée
 *   - publishDate           → date de publication
 *   - contractTypes         → tableau de types de contrat
 *   - details.salary
 */
function normalizeOffer(raw) {
  const salary = raw.details?.salary;
  let salaryStr = null;
  if (salary?.min && salary?.max) {
    const per = salary.recurrence === "year" ? "k€/an" : salary.currency || "€";
    salaryStr = `${salary.min} - ${salary.max} ${per}`;
  } else if (salary?.min) {
    const per = salary.recurrence === "year" ? "k€/an" : salary.currency || "€";
    salaryStr = `${salary.min}+ ${per}`;
  }

  const contractTypes = Array.isArray(raw.contractTypes)
    ? raw.contractTypes.map(translateContractType).join(", ")
    : translateContractType(raw.contractTypes || "");

  return {
    source_id: String(raw.id || raw.objectID || ""),
    title: stripHtml(raw.title || ""),
    description: stripHtml(
      raw.description || raw.rawDescription || raw.descriptionPreview || "",
    ),
    company: stripHtml(raw.smallCompany?.companyName || ""),
    location: stripHtml(
      Array.isArray(raw.formattedPlaces)
        ? raw.formattedPlaces.join(", ")
        : raw.formattedPlaces || "",
    ),
    published_at: raw.publishDate || raw.createdAt || null,
    contract_type: contractTypes,
    salary: salaryStr,
  };
}

module.exports = { normalizeOffer, stripHtml };
