require('module-alias/register');
const { normalizeOffer, stripHtml } = require('@/data/normalizer');


const mockOffer = {
  id: "-NzXrt3saSop7HS6YEKK",
  objectID: "-NzXrt3saSop7HS6YEKK",
  title: "Senior Back-End Developer",
  description: "<p>Rejoignez notre équipe   dynamique.</p>",
  smallCompany: { companyName: "Sensefuel" },
  formattedPlaces: ["Villeneuve-d'Ascq, France"],
  publishDate: 1776766986369000,
  contractTypes: ["permanent"],
  details: {
    salary: { min: 45, max: 60, currency: "€", recurrence: "year" }
  }
};

describe('normalizeOffer', () => {
  test('retourne tous les champs attendus', () => {
    const result = normalizeOffer(mockOffer);
    expect(result).toHaveProperty('source_id');
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('company');
    expect(result).toHaveProperty('location');
    expect(result).toHaveProperty('published_at');
    expect(result).toHaveProperty('contract_type');
    expect(result).toHaveProperty('salary');
  });

  test('extrait le source_id depuis id', () => {
    const result = normalizeOffer(mockOffer);
    expect(result.source_id).toBe('-NzXrt3saSop7HS6YEKK');
  });


  test('fallback source_id sur objectID si id absent', () => {
    const { id, ...withoutId } = mockOffer;
    const result = normalizeOffer(withoutId);
    expect(result.source_id).toBe('-NzXrt3saSop7HS6YEKK');
  });

  test('extrait le titre correctement', () => {
    const result = normalizeOffer(mockOffer);
    expect(result.title).toBe('Senior Back-End Developer');
  });

  test('supprime les balises HTML de la description', () => {
    const result = normalizeOffer(mockOffer);
    expect(result.description).not.toContain('<p>');
    expect(result.description).toBe('Rejoignez notre équipe dynamique.');
  });

  test('extrait le nom de la company depuis smallCompany', () => {
    const result = normalizeOffer(mockOffer);
    expect(result.company).toBe('Sensefuel');
  });

  test('extrait la localisation depuis formattedPlaces', () => {
    const result = normalizeOffer(mockOffer);
    expect(result.location).toBe("Villeneuve-d'Ascq, France");
  });


  test('extrait published_at depuis publishDate', () => {
    const result = normalizeOffer(mockOffer);
    expect(result.published_at).toBe(1776766986369000);
  });

  test('formate le salaire min/max avec recurrence year', () => {
    const result = normalizeOffer(mockOffer);
    expect(result.salary).toBe('45 - 60 k€/an');
  });


  test('formate le salaire min seul', () => {
    const result = normalizeOffer({
      ...mockOffer,
      details: { salary: { min: 45, currency: '€', recurrence: 'year' } }
    });
    expect(result.salary).toBe('45+ k€/an');
  });

  test('retourne null si pas de salaire', () => {
    const result = normalizeOffer({ ...mockOffer, details: {} });
    expect(result.salary).toBeNull();
  });

  test('gère plusieurs types de contrat', () => {
    const result = normalizeOffer({ ...mockOffer, contractTypes: ['permanent', 'freelance'] });
    expect(result.contract_type).toBe('permanent, freelance');
  });

  test('gère formattedPlaces avec plusieurs villes', () => {
    const result = normalizeOffer({ ...mockOffer, formattedPlaces: ['Paris, France', 'Lyon, France'] });
    expect(result.location).toBe('Paris, France, Lyon, France');
  });
});

describe('stripHtml', () => {
  test('supprime les balises simples', () => {
    expect(stripHtml('<b>Hello</b>')).toBe('Hello');
  });

  test('supprime les balises imbriquées', () => {
    expect(stripHtml('<div><p>Texte</p></div>')).toBe('Texte');
  });

  test('normalise les espaces multiples', () => {
    expect(stripHtml('hello   world')).toBe('hello world');
  });

  test('retourne chaîne vide si null', () => {
    expect(stripHtml(null)).toBe('');
  });

  test('retourne chaîne vide si undefined', () => {
    expect(stripHtml(undefined)).toBe('');
  });
});