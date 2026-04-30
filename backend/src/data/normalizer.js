// Supprime les balises HTML
function stripHtml(str) {
  if (!str) return "";
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
  // Salaire depuis details.salary
  // ex: { min: 45, max: 60, currency: "€", recurrence: "year", maxPerYear: 60 }
  const salary = raw.details?.salary;
  let salaryStr = null;
  if (salary?.min && salary?.max) {
    const currency = salary.currency || "€";
    const per = salary.recurrence === "year" ? "k€/an" : salary.currency || "€";
    salaryStr = `${salary.min} - ${salary.max} ${per}`;
  } else if (salary?.min) {
    const per = salary.recurrence === "year" ? "k€/an" : salary.currency || "€";
    salaryStr = `${salary.min}+ ${per}`;
  }

  // Types de contrat (tableau)
  const contractTypes = Array.isArray(raw.contractTypes)
    ? raw.contractTypes.join(", ")
    : raw.contractTypes || "";

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
