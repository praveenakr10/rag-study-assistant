"""
retriever.py — hybrid retrieval: BM25 + dense vectors + CrossEncoder re-ranking
"""
import numpy as np
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer, CrossEncoder
import chromadb

EMBED_MODEL   = "BAAI/bge-base-en-v1.5"
RERANK_MODEL  = "cross-encoder/ms-marco-MiniLM-L-6-v2"
TOP_K_FETCH   = 20    # candidates to pull before re-ranking
TOP_K_FINAL   = 6     # chunks sent to the LLM

embedder  = SentenceTransformer(EMBED_MODEL)
reranker  = CrossEncoder(RERANK_MODEL)

_client    = chromadb.PersistentClient(path="./chroma_db")
collection = _client.get_or_create_collection(
    name="study_docs",
    metadata={"hnsw:space": "cosine"},
)

def _all_docs():
    result = collection.get(include=["documents", "metadatas"])
    return result["ids"], result["documents"], result["metadatas"]

def _rrf(dense_ids: list, bm25_ids: list, k: int = 60) -> list:
    """Reciprocal Rank Fusion — combines two ranked lists."""
    scores = {}
    for rank, doc_id in enumerate(dense_ids):
        scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank + 1)
    for rank, doc_id in enumerate(bm25_ids):
        scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank + 1)
    return sorted(scores, key=scores.get, reverse=True)

def retrieve(query: str, source_filter: str | None = None) -> list[dict]:
    """
    Full retrieval pipeline:
      1. Dense retrieval (ChromaDB cosine similarity)
      2. BM25 keyword retrieval
      3. Reciprocal Rank Fusion
      4. CrossEncoder re-ranking
    Returns top-K chunks with metadata.
    """
    all_ids, all_docs, all_metas = _all_docs()
    if not all_ids:
        return []

    where = {"source": source_filter} if source_filter else None

    # ── 1. Dense retrieval ──
    query_emb = embedder.encode([query]).tolist()
    dense_res  = collection.query(
        query_embeddings=query_emb,
        n_results=min(TOP_K_FETCH, len(all_ids)),
        where=where,
        include=["documents", "metadatas", "distances"],
    )
    dense_ids  = dense_res["ids"][0]
    id_to_doc  = dict(zip(dense_res["ids"][0], dense_res["documents"][0]))
    id_to_meta = dict(zip(dense_res["ids"][0], dense_res["metadatas"][0]))

    # ── 2. BM25 retrieval ──
    tokenized = [d.lower().split() for d in all_docs]
    bm25      = BM25Okapi(tokenized)
    bm25_sc   = bm25.get_scores(query.lower().split())
    top_bm25  = np.argsort(bm25_sc)[::-1][:TOP_K_FETCH]
    bm25_ids  = [all_ids[i] for i in top_bm25]

    # Fill id_to_doc / id_to_meta for bm25 hits not in dense
    for i in top_bm25:
        doc_id = all_ids[i]
        if doc_id not in id_to_doc:
            id_to_doc[doc_id]  = all_docs[i]
            id_to_meta[doc_id] = all_metas[i]

    # ── 3. RRF fusion ──
    fused_ids  = _rrf(dense_ids, bm25_ids)[:TOP_K_FETCH]
    candidates = [(doc_id, id_to_doc[doc_id]) for doc_id in fused_ids if doc_id in id_to_doc]

    # ── 4. CrossEncoder re-ranking ──
    pairs  = [(query, text) for _, text in candidates]
    scores = reranker.predict(pairs)
    ranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)

    return [
        {
            "text":   text,
            "source": id_to_meta.get(doc_id, {}).get("source", "unknown"),
            "page":   id_to_meta.get(doc_id, {}).get("page", "?"),
            "score":  round(float(score), 4),
        }
        for (doc_id, text), score in ranked[:TOP_K_FINAL]
    ]
