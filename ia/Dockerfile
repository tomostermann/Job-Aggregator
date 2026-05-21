FROM python:3.11-slim

WORKDIR /app

# Installe les dépendances système nécessaires pour psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Copie et installe les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pré-télécharge le modèle dans l'image Docker
# Comme ça il n'est pas re-téléchargé à chaque démarrage du container
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
