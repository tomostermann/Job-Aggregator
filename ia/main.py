import os
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

try:
    import psycopg2
except ImportError:
    psycopg2 = None

# Chargement du modèle au démarrage
# all-MiniLM-L6-v2 : 80MB
print("[IA] Chargement du modèle sentence-transformers...")
model = SentenceTransformer("all-MiniLM-L6-v2")
print("[IA] Modèle chargé ✓")

app = FastAPI(title="JobAggregator IA Service")


# Connexion PostgreSQL


def get_db():
    if psycopg2 is None:
        raise HTTPException(
            status_code=503,
            detail="psycopg2 non disponible — ce endpoint nécessite Docker",
        )
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
    )


# Modèles de données (ce que l'API attend/retourne)


class ScoreRequest(BaseModel):
    query: str  # ex: "Stage Python Paris backend"
    limit: int = 10  # nombre de résultats à retourner


class ScoreResult(BaseModel):
    id: str
    title: str
    company: str
    location: str
    contract_type: str
    salary: str | None
    ai_score: int  # score entre 0 et 100


# GET /health — vérifie que le service tourne


@app.get("/health")
def health():
    return {"status": "ok", "model": "all-MiniLM-L6-v2"}


# POST /compute-embeddings
# Calcule les vecteurs pour toutes les offres en DB


@app.post("/compute-embeddings")
def compute_embeddings():
    """
    Lit toutes les offres depuis PostgreSQL,
    calcule un embedding (vecteur 384 dims) pour chaque offre
    à partir de son titre + description,
    et stocke ce vecteur dans la colonne embedding (bytea).
    """
    conn = get_db()
    cur = conn.cursor()

    # Récupère toutes les offres sans embedding
    cur.execute("SELECT id, title, description FROM offers WHERE embedding IS NULL")
    rows = cur.fetchall()

    if not rows:
        conn.close()
        return {
            "message": "Rien à calculer, tous les embeddings sont à jour",
            "count": 0,
        }

    print(f"[IA] Calcul des embeddings pour {len(rows)} offres...")

    # Concatène titre + description pour chaque offre

    texts = [f"{row[1]} {row[2] or ''}" for row in rows]
    ids = [row[0] for row in rows]

    embeddings = model.encode(texts, show_progress_bar=True, batch_size=32)

    # Stocke chaque vecteur en DB sous forme de bytes
    for offer_id, embedding in zip(ids, embeddings):
        embedding_bytes = embedding.astype(np.float32).tobytes()
        cur.execute(
            "UPDATE offers SET embedding = %s WHERE id = %s",
            (psycopg2.Binary(embedding_bytes), offer_id),
        )

    conn.commit()
    conn.close()

    print(f"[IA] {len(rows)} embeddings calculés et stockés ✓")
    return {"message": "Embeddings calculés", "count": len(rows)}


# POST /score
# Reçoit une requête texte, retourne les offres les plus pertinentes


@app.post("/score")
def score_offers(req: ScoreRequest):
    """
    1. Calcule l'embedding de la requête utilisateur
    2. Récupère tous les embeddings des offres depuis la DB
    3. Calcule la cosine similarity entre la requête et chaque offre
    4. Retourne les `limit(10)` meilleures offres avec leur score IA
    """
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="La requête ne peut pas être vide")

    # Étape 1 : embedding de la requête
    query_embedding = model.encode(req.query, normalize_embeddings=True)

    # Étape 2 : récupère toutes les offres avec leur embedding
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, title, company, location, contract_type, salary, embedding FROM offers WHERE embedding IS NOT NULL"
    )
    rows = cur.fetchall()
    conn.close()

    if not rows:
        return []

    # Extrait les mots de la requête pour le boost de localisation
    # Ex: "stage paris python" → ["stage", "paris", "python"]
    query_words = [w.lower().strip() for w in req.query.split() if len(w) > 2]

    # Étape 3 : calcul de la cosine similarity pour chaque offre
    results = []
    for row in rows:
        offer_id, title, company, location, contract_type, salary, embedding_bytes = row

        # Convertit les bytes stockés en DB en vecteur numpy
        embedding = np.frombuffer(bytes(embedding_bytes), dtype=np.float32)

        # Normalise pour la cosine similarity
        norm = np.linalg.norm(embedding)
        if norm == 0:
            continue
        embedding_normalized = embedding / norm

        # Cosine similarity = produit scalaire (puisque les vecteurs sont normalisés)
        # On applique sqrt() pour étaler les scores : sqrt(0.5)*100=70 au lieu de 50
        similarity = float(np.dot(query_embedding, embedding_normalized))
        base_score = float(np.sqrt(max(0.0, similarity))) * 100

        # Boost de localisation : +30% si un mot de la requête apparaît dans la ville
        location_text = (location or "").lower()
        location_match = any(word in location_text for word in query_words)
        if location_match:
            base_score *= 1.3

        ai_score = max(0, min(100, int(base_score)))

        results.append(
            ScoreResult(
                id=str(offer_id),
                title=title or "",
                company=company or "",
                location=location or "",
                contract_type=contract_type or "",
                salary=salary,
                ai_score=ai_score,
            )
        )

    # Trie par score décroissant et retourne les `limit` meilleurs
    results.sort(key=lambda x: x.ai_score, reverse=True)
    return results[: req.limit]
