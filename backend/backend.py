"""
FastAPI backend for StudyRAG
Run: uvicorn backend:app --reload --port 8000
"""
import os, json, asyncio
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import tempfile
from dotenv import load_dotenv

load_dotenv()

from ingestion   import ingest_file, collection
from retriever   import retrieve
from generator   import answer
from study_modes import (generate_flashcards, generate_quiz,
                          summarise_topic, eli5Topic, compare_topics)

app = FastAPI(title="StudyRAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Upload ────────────────────────────────────────────────────────────────────
@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    allowed = {".pdf", ".docx", ".pptx", ".txt"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(400, f"Unsupported file type: {ext}")
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    try:
        chunks = ingest_file(tmp_path, original_name=file.filename)
    finally:
        os.unlink(tmp_path)
    return {"filename": file.filename, "chunks": chunks}


# ── Documents list ─────────────────────────────────────────────────────────────
@app.get("/api/documents")
def list_docs():
    result = collection.get(include=["metadatas"])
    docs = {}
    for meta in result["metadatas"]:
        name = meta.get("source", "unknown")
        docs[name] = docs.get(name, 0) + 1
    return {"documents": [{"name": k, "chunks": v} for k, v in docs.items()]}


# ── Delete document ────────────────────────────────────────────────────────────
@app.delete("/api/documents/{filename}")
def delete_doc(filename: str):
    result = collection.get(include=["metadatas"])
    ids_to_del = [
        result["ids"][i]
        for i, m in enumerate(result["metadatas"])
        if m.get("source") == filename
    ]
    if ids_to_del:
        collection.delete(ids=ids_to_del)
    return {"deleted": len(ids_to_del)}


# ── Chat (streaming SSE) ───────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    query:   str
    history: List[dict] = []

@app.post("/api/chat/stream")
async def chat_stream(req: ChatRequest):
    async def event_gen():
        # Run blocking IO in thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, answer, req.query, req.history)

        # Stream sources first
        yield f"data: {json.dumps({'type': 'sources', 'data': result['sources']})}\n\n"
        yield f"data: {json.dumps({'type': 'meta', 'data': {'from_docs': result['from_docs']}})}\n\n"

        # Stream tokens word by word (simulated; replace with real streaming if using OpenAI)
        words = result["answer"].split(" ")
        for i, word in enumerate(words):
            token = word + (" " if i < len(words) - 1 else "")
            yield f"data: {json.dumps({'type': 'token', 'data': token})}\n\n"
            await asyncio.sleep(0.012)

        yield "data: [DONE]\n\n"

    return StreamingResponse(event_gen(), media_type="text/event-stream")


# ── Study modes ────────────────────────────────────────────────────────────────
class StudyRequest(BaseModel):
    topic: str
    count: int = 5

class CompareRequest(BaseModel):
    topic_a: str
    topic_b: str

@app.post("/api/study/flashcards")
async def flashcards(req: StudyRequest):
    loop   = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, generate_flashcards, req.topic, req.count)
    return {"result": result}

@app.post("/api/study/quiz")
async def quiz(req: StudyRequest):
    loop   = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, generate_quiz, req.topic, req.count)
    return {"result": result}

@app.post("/api/study/summarise")
async def summarise(req: StudyRequest):
    loop   = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, summarise_topic, req.topic)
    return {"result": result}

@app.post("/api/study/eli5")
async def eli5(req: StudyRequest):
    loop   = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, eli5Topic, req.topic)
    return {"result": result}

@app.post("/api/study/compare")
async def compare(req: CompareRequest):
    loop   = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, compare_topics, req.topic_a, req.topic_b)
    return {"result": result}

@app.get("/api/health")
def health():
    return {"status": "ok"}
