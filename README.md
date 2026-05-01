#  StudyRAG

A full-stack Retrieval-Augmented Generation (RAG) application that turns your uploaded documents into an interactive study companion. Upload lecture notes, textbooks, or slides and chat with them, generate flashcards, take quizzes, get summaries, and more.

---

##  Features

| Feature | Description |
|---|---|
|  **RAG Chat** | Ask questions about your documents with streamed responses and inline source citations `[Doc: file, Page: N]` |
|  **Flashcards** | Auto-generate Q&A flashcards on any topic extracted from your uploaded material |
|  **Quiz Mode** | Multiple-choice questions with correct answers and one-line explanations |
|  **Summarise** | Structured bullet-point summaries with a 1-sentence overview and key takeaways |
|  **ELI5** | Plain-language explanations with real-world analogies for any topic |
|  **Compare** | Side-by-side comparison tables for two topics from your documents |
|  **Hybrid Retrieval** | BM25 + dense vector search fused with Reciprocal Rank Fusion, re-ranked by a CrossEncoder |
|  **Multi-format Ingestion** | Supports PDF, DOCX, PPTX, and TXT out of the box |
|  **Smart Fallback** | If a question isn't covered by your documents, the LLM answers from general knowledge and says so clearly |
|  **Document Management** | Upload, list, and delete individual documents from the persistent vector store |

---

##  Architecture

```
┌──────────────────────────────────────────────────┐
│                  React Frontend                  │
│   Chat · Flashcards · Quiz · Summary · Compare   │
│        Drag-and-drop upload · Document list      │
└────────────────────┬─────────────────────────────┘
                     │  REST + SSE (streaming)
┌────────────────────▼─────────────────────────────┐
│               FastAPI Backend (:8000)             │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │          INGESTION PIPELINE              │    │
│  │  Upload → Parse (PDF/DOCX/PPTX/TXT)     │    │
│  │  → Sentence-aware chunker (400w/80w OL) │    │
│  │  → BGE embeddings (768-dim)             │    │
│  │  → Upsert into ChromaDB (cosine HNSW)  │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │           RETRIEVAL PIPELINE             │    │
│  │  Query → Dense (ChromaDB cosine top-20) │    │
│  │        + BM25 keyword (top-20)          │    │
│  │  → RRF fusion                           │    │
│  │  → CrossEncoder re-rank → top-6 chunks │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │        GENERATION / STUDY MODES         │    │
│  │  LLM → Llama 3.3 70B              │    │
│  │  Chat · Flashcards · Quiz · Summary    │    │
│  │  ELI5 · Compare                        │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ChromaDB (persistent local vector store)        │
└──────────────────────────────────────────────────┘
```

---

##  Tech Stack

### Backend
| Library | Role |
|---|---|
| [FastAPI](https://fastapi.tiangolo.com/) | REST API with SSE streaming responses |
| [ChromaDB](https://www.trychroma.com/) | Local persistent vector store (cosine HNSW index) |
| [sentence-transformers](https://www.sbert.net/) | `BAAI/bge-base-en-v1.5` for embeddings; `cross-encoder/ms-marco-MiniLM-L-6-v2` for re-ranking |
| [rank-bm25](https://github.com/dorianbrown/rank_bm25) | BM25Okapi keyword retrieval |
| [Groq](https://groq.com/) | LLM API - **Llama 3.3 70B Versatile** |
| PyMuPDF · python-docx · python-pptx | Document parsing for PDF, DOCX, PPTX |
| uvicorn | ASGI server |

### Frontend
| Library | Role |
|---|---|
| [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) | UI framework and build tool |
| [react-markdown](https://github.com/remarkjs/react-markdown) + remark-gfm | Rendered markdown in chat responses |
| [react-dropzone](https://react-dropzone.js.org/) | Drag-and-drop file upload with progress |
| [lucide-react](https://lucide.dev/) | Icon set |

### Notebook
| Library | Role |
|---|---|
| matplotlib · seaborn | Pipeline visualisations and evaluation dashboard |
| scikit-learn | PCA of embeddings, cosine similarity for relevancy scoring |
| nltk | BLEU score computation |
| rouge-score | ROUGE-1, ROUGE-2, ROUGE-L |
| pandas | Results tables and metric aggregation |

---

##  Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+


### 1. Clone the repo

```bash
git clone https://github.com/your-username/rag-study-assistant.git
cd rag-study-assistant
```

### 2. Backend setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Start the server:

```bash
uvicorn backend:app --reload --port 8000
```

API available at `http://localhost:8000`.

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```


---

##  Usage

1. **Upload documents** - Drag and drop PDF, DOCX, PPTX, or TXT files using the sidebar. Each file is parsed, chunked, embedded, and stored in ChromaDB. Previously stored chunks for the same filename are replaced automatically.

2. **Chat** - Ask any question in the Chat tab. The assistant retrieves relevant chunks via the hybrid pipeline, generates a streamed answer with source citations, and falls back to general knowledge if the docs don't cover the topic.

3. **Study tools** - Enter a topic in the Flashcards, Quiz, Summary, or Compare tabs to generate study material grounded in your uploaded documents.


##  RAG Pipeline 

The system runs a four-stage retrieval pipeline designed to combine the strengths of keyword and semantic search before passing context to the LLM.

### Stage 1 - Ingestion

| Step | Detail |
|---|---|
| **Parse** | PyMuPDF extracts text page-by-page from PDFs. python-docx groups paragraphs in blocks of 20. python-pptx concatenates all shape text per slide. TXT files are grouped in lines of 50. |
| **Chunk** | A sentence-aware sliding window splits each page block into ~400-word chunks with 80-word overlap to avoid cutting mid-thought. Sentence boundaries are detected by regex on `.!?` punctuation. |
| **Embed** | All chunk texts are encoded with `BAAI/bge-base-en-v1.5` (768-dimensional dense vectors). |
| **Store** | Chunks are upserted into ChromaDB with cosine HNSW indexing. Metadata stores `source` (filename) and `page` number per chunk. Any previously stored chunks for the same filename are deleted first. |

### Stage 2 - Retrieval

**Step 1 - Dense Retrieval**

The user query is encoded with the same BGE model and compared against all stored chunk embeddings using cosine similarity. The top 20 candidates are returned from ChromaDB.

**Step 2 - BM25 Sparse Retrieval**

`BM25Okapi` scores all chunks in the collection against the tokenised query using term frequency statistics. The top 20 keyword-matched candidates are retrieved independently of the dense results.

**Step 3 - Reciprocal Rank Fusion (RRF)**

RRF merges the two ranked lists into a single combined ranking without needing to normalise scores across different scales:

```
RRF_score(chunk) = 1 / (k + rank_dense) + 1 / (k + rank_bm25)   where k = 60
```

Chunks appearing in both lists are boosted. Chunks exclusive to one list are still included, so neither keyword nor semantic signal is discarded.

**Step 4 - CrossEncoder Re-ranking**

The top 20 fused candidates are scored by `cross-encoder/ms-marco-MiniLM-L-6-v2`, which jointly encodes the query and each candidate chunk to produce a fine-grained relevance score. The top 6 chunks by CrossEncoder score are passed to the LLM as context.

### Stage 3 - Generation

The 6 final chunks are formatted as numbered excerpts with `[source, Page N]` headers and injected into the LLM prompt. Llama 3.3 70B is instructed to cite each fact inline as `[Doc: filename, Page: N]`. If the highest CrossEncoder score is below the configured threshold, the query is routed to a general knowledge fallback prompt instead. Up to 6 turns of chat history are maintained in the context window.


---

## 📊 Evaluation

The notebook (`rag_pipeline_with_evaluation.ipynb`) includes a full automated evaluation framework. It auto-generates question-answer pairs from the ingested document, runs each question through the complete RAG pipeline, and scores outputs across six metrics.


Auto-generates QA pairs from ingested chunks, runs them through the full pipeline, and scores across 8 metrics.
 
| Metric | Target | Description |
|---|---|---|
| **Faithfulness** | ≥ 0.85 | LLM judge (0–1): are all claims grounded in retrieved context? |
| **Answer Relevancy** | ≥ 0.80 | BGE cosine similarity between question and generated answer |
| **Context Precision** | ≥ 0.75 | Fraction of top-4 chunks judged relevant by LLM |
| **Context Recall** | ≥ 0.80 | LLM score (0–1): does retrieved context cover the reference answer? |
| **BLEU-1 / BLEU-2** | ≥ 0.40 / ≥ 0.20 | Unigram and bigram precision vs. reference answer |
| **ROUGE-1 / ROUGE-2 / ROUGE-L** | ≥ 0.45 / ≥ 0.20 / ≥ 0.40 | F1 overlap (unigram, bigram, LCS) vs. reference answer |
| **Hit Rate** | ≥ 0.90 | Fraction of questions where the correct chunk appears in top-K |
| **MRR** | ≥ 0.75 | Mean reciprocal rank of the first correct chunk |
 
