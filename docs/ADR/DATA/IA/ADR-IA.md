# ADR-IA : Choix du modèle IA pour la recommandation d'offres d'emploi

## Statut

Accepté



## Contexte

Le projet Job Aggregator agrège des offres d'emploi tech depuis l'API WeLoveDevs (~1800+ offres en base).
L'objectif est de proposer aux utilisateurs des recommandations **sans leur demander de remplir un profil** :
l'utilisateur tape une recherche en langage naturel (ex : "stage Python Paris backend") et le système
retourne les offres les plus pertinentes, triées par score de similarité sémantique.

### Contraintes identifiées au départ

| Contrainte | Raison |
|---|---|
| Taille ≤ 500 MB | Build Docker raisonnable, pas de surcharge mémoire |
| Résultat < 5 secondes par offre | Pas de latence bloquante pour l'utilisateur |
| Pas de fine-tuning au démarrage | Déploiement simple, container démarre directement |
| Fonctionnement hors ligne | Pas de dépendance à une API externe payante |
| Stack Python | On a déjà un microservice FastAPI, on reste dedans |

---

## Décision

Nous utilisons **`sentence-transformers` avec le modèle `all-MiniLM-L6-v2`**.

### Comment ça fonctionne concrètement

1. **Calcul des embeddings des offres** (fait une seule fois via `POST /compute-embeddings`) :
   - Pour chaque offre en base, on concatène son titre + sa description
   - On encode ce texte en un vecteur de 384 chiffres (un "embedding")
   - Ce vecteur est stocké en base dans la colonne `embedding` (type `BYTEA`)

2. **Scoring en temps réel** (à chaque recherche via `POST /score`) :
   - On encode la requête de l'utilisateur en vecteur
   - On calcule la **cosine similarity** entre ce vecteur et chaque vecteur d'offre stocké
   - On applique `sqrt(similarity) × 100` pour obtenir un score entre 0 et 100
   - On applique un **boost de localisation +30%** si un mot de la requête correspond à la ville de l'offre
   - On retourne les N meilleures offres triées par score

### Exemple concret

Requête : `"stage python paris"`

| Offre | Ville | Similarité brute | Après sqrt×100 | Après boost lieu | Score final |
|---|---|---|---|---|---|
| Software Engineer Python / FastAPI | Paris | 0.38 | 61 | ×1.3 = **79** | 79 ✅ |
| Développeur Python expérimenté | Lille | 0.48 | 69 | pas de boost | 69 |
| Stage full stack developer | Marseille | 0.37 | 60 | pas de boost | 60 |

Le résultat le plus pertinent (Paris + Python) est bien en tête.

### Caractéristiques du modèle retenu

| Critère | Valeur |
|---|---|
| Taille sur disque | ~80 MB |
| Dimensions du vecteur | 384 |
| Temps d'encodage | ~2ms / offre |
| Fine-tuning requis | Non |
| Langue | Multilingue (fr/en) |
| Licence | Apache 2.0 |

---

## Alternatives rejetées

### Alternative 1 — OpenAI API (`text-embedding-ada-002`)

**Description** : Utiliser l'API OpenAI pour calculer les embeddings à la volée, sans héberger de modèle.

**Ce qu'on a évalué** :
- L'API retourne des embeddings de très haute qualité (1536 dimensions)
- L'intégration est simple (une requête HTTP)
- Pas besoin d'héberger un modèle

**Pourquoi on a rejeté** :
- **Coût** : facturation à l'usage (~$0.0001 / 1000 tokens). Pour 1800 offres × descriptions longues,
  le coût de pré-calcul est non négligeable, et surtout on ne peut pas se permettre une API payante
  dans un projet étudiant sans budget
- **Dépendance réseau** : si l'API OpenAI est down, notre feature est down
- **Latence** : chaque recherche = un aller-retour HTTP (~200-500ms) au lieu de ~2ms en local
- **Confidentialité** : les descriptions d'offres partent sur des serveurs externes

### Alternative 2 — TF-IDF + cosine similarity (scikit-learn)

**Description** : Approche classique de recherche par correspondance de mots-clés pondérés,
sans modèle de deep learning.

**Ce qu'on a évalué** :
- Léger (~5 MB)
- Très rapide
- Pas de dépendance externe

**Pourquoi on a rejeté** :

TF-IDF compare des mots exacts, pas des concepts. Exemple :

```
Requête : "développeur backend"
Offre A : "Ingénieur serveur Node.js"  → TF-IDF score = 0 (aucun mot en commun)
Offre B : "développeur backend React"  → TF-IDF score = élevé (mots identiques)
```

Avec sentence-transformers :
```
Requête : "développeur backend"
Offre A : "Ingénieur serveur Node.js"  → score = 62 (sémantiquement proche)
Offre B : "développeur backend React"  → score = 78
```

TF-IDF aurait retourné 0 offres pour "ingénieur serveur" alors que c'est exactement ce
que cherchait l'utilisateur. Inacceptable pour une feature de recommandation.

---

## Ce qu'on a testé et abandonné en cours de route

### Tentative 1 — Score brut × 100

Au départ, le score était simplement `cosine_similarity × 100`.

**Problème observé** : une similarité de 0.50 est en réalité un **excellent** match pour ce modèle,
mais s'affichait comme "50/100" ce qui donnait l'impression d'une pertinence médiocre.

```
# Avant
similarity = 0.50
ai_score = int(0.50 * 100) = 50  ← paraît faible à l'utilisateur
```

**Solution adoptée** : transformation `sqrt()` qui étale la plage vers le haut sans fausser l'ordre.

```
# Après
similarity = 0.50
ai_score = int(sqrt(0.50) * 100) = int(0.707 * 100) = 70  ← plus lisible
```

### Tentative 2 — Normalisation min-max

On a aussi essayé de normaliser les scores pour que le meilleur résultat soit toujours à ~95
et le pire à ~25, peu importe les valeurs absolues.

```python
# Formule testée
normalized = ((score - score_min) / (score_max - score_min)) * 70 + 25
```

**Problème** : cette approche **fausse les statistiques**. Si toutes les offres sont peu pertinentes,
le système affiche quand même un score de 95 pour la "meilleure" d'entre elles, ce qui est trompeur.

**Décision** : abandonné au profit de `sqrt()` qui préserve le sens absolu des scores.

### Tentative 3 — Score côté client (computeOfferScore)

Avant d'intégrer le microservice, on avait une fonction JS côté frontend qui calculait un score
basé sur des règles manuelles (présence de mots-clés, ancienneté, salaire renseigné...).

```typescript
// Score basé sur des heuristiques sans rapport avec la requête
function computeOfferScore(offer: Offer): number {
  const keywords = ["react", "python", "docker"...];
  const matches = keywords.filter(k => text.includes(k)).length;
  const keywordScore = Math.min(40, matches * 6);
  // + bonus ancienneté, salaire, description longue...
}
```

**Problème** : ce score était **identique pour toutes les requêtes**. Que l'utilisateur cherche
"Python" ou "Java", une offre React avait le même score. C'était inutile comme indicateur de pertinence.

**Décision** : remplacé par le vrai score IA. Le score n'est maintenant affiché que si l'offre
provient d'une vraie recherche (`offer.ai_score !== undefined`).

---

## Limitations connues

- **Scores bas en valeur absolue** : même avec `sqrt()`, les scores restent inférieurs à 80
  pour la plupart des requêtes. C'est inhérent au modèle et ne reflète pas une mauvaise qualité.
- **Embeddings statiques** : les vecteurs sont calculés à l'ingestion. Si une description d'offre
  change, il faut relancer `POST /compute-embeddings`.
- **Pas de personnalisation par utilisateur** : les recommandations du dashboard utilisent une
  requête générique (`"développeur web fullstack stage CDI"`). Le profil utilisateur n'est pas
  pris en compte (feature non développée).
- **Optimisé pour l'anglais** : le modèle `all-MiniLM-L6-v2` fonctionne en multilingue mais
  ses performances sont légèrement meilleures sur des textes en anglais.

---

## Approche d'évaluation

### Tests réalisés manuellement

| Requête | 1er résultat attendu | Résultat obtenu | Cohérent ? |
|---|---|---|---|
| "stage python paris" | Offre Python à Paris | Software Engineer Python / FastAPI — Paris | ✅ |
| "stage python paris" (avant boost localisation) | Offre Python à Paris | Dev Python expérimenté — **Lille** | ❌ |
| "stage python paris" (après boost localisation) | Offre Python à Paris | Software Engineer Python / FastAPI — Paris | ✅ |
| "développeur react frontend" | Offre React | Frontend Developer React | ✅ |

### Le problème de localisation et sa correction

Avant d'ajouter le boost, une offre Python à Lille pouvait scorer plus haut qu'une offre Python
à Paris, parce que la similarité sémantique ne prend pas en compte la localisation géographique.

**Correction implémentée** : on extrait les mots de la requête et on vérifie si l'un d'eux
apparaît dans la ville de l'offre. Si oui, le score est multiplié par 1.3.

```python
query_words = ["stage", "python", "paris"]
location_text = "paris, france"

# "paris" est dans query_words ET dans location_text → boost appliqué
if any(word in location_text for word in query_words):
    base_score *= 1.3
```

### Temps de réponse mesuré

Testé avec `curl` sur 1800+ offres :
- `POST /score` : ~300-400ms (calcul embedding requête + comparaison vectorielle complète)
- Objectif < 500ms : **atteint** ✅

---

## Preuve dans le code

- `ia/main.py` — microservice FastAPI complet (health, compute-embeddings, score)
- `ia/Dockerfile` — modèle pré-téléchargé au build (`RUN python -c "...SentenceTransformer(...)"`)
- `backend/src/routes/recommendations.ts` — route proxy vers le microservice
- `frontend/app/offers/page.tsx` — bascule sur `/api/recommendations` en mode "Pertinence IA"
- `frontend/components/OfferCard.tsx` — affiche le score uniquement si `offer.ai_score !== undefined`
- `backend/src/config/schema.sql` — colonne `embedding BYTEA` sur la table `offers`
- `docker-compose.yml` — service `ia` sur le port 8000, réseau `app-network`
