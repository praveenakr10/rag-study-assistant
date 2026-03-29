"""
generator.py — LLM generation with smart fallback gate
Uses Groq (free) with Llama 3.3 70B
"""
import os
from groq import Groq
from dotenv import load_dotenv
from retriever import retrieve

load_dotenv()

_client          = Groq(api_key=os.environ["GROQ_API_KEY"])
MODEL            = "llama-3.3-70b-versatile"
SCORE_THRESHOLD  = 0.0    # CrossEncoder scores; tune after testing with your docs
MAX_HISTORY_TURNS = 6

SYSTEM_PROMPT = """You are StudyRAG, a helpful AI study assistant.

Rules:
- When answering from documents, cite sources inline as [Doc: filename, Page: N].
- When answering from general knowledge, start with: "This isn't covered in your uploaded documents, but from general knowledge:"
- Be concise and structured. Use bullet points for lists of facts.
- If a question is ambiguous, answer the most likely interpretation.
- Never make up citations or page numbers."""

def _format_context(chunks: list[dict]) -> str:
    parts = []
    for i, c in enumerate(chunks):
        parts.append(f"[{i+1}] {c['source']}, Page {c['page']}:\n{c['text']}")
    return "\n\n---\n\n".join(parts)

def answer(query: str, chat_history: list[dict], source_filter: str | None = None) -> dict:
    """
    Generate an answer using RAG with smart fallback.

    Returns:
        {
          "answer":    str,
          "sources":   list[dict],  # chunks used (empty if general knowledge)
          "from_docs": bool,
        }
    """
    chunks     = retrieve(query, source_filter=source_filter)
    best_score = max((c["score"] for c in chunks), default=-999)
    use_docs   = bool(chunks) and best_score > SCORE_THRESHOLD

    if use_docs:
        user_content = (
            "Answer the question using ONLY the document excerpts below. "
            "Cite each fact as [Doc: filename, Page: N]. "
            "If the excerpts don't contain enough information, say so.\n\n"
            f"Document excerpts:\n{_format_context(chunks)}\n\n"
            f"Question: {query}"
        )
    else:
        user_content = (
            "The user's uploaded documents don't appear to cover this topic. "
            "Answer from your general knowledge and clearly say so at the start.\n\n"
            f"Question: {query}"
        )

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for turn in chat_history[-(MAX_HISTORY_TURNS * 2):]:
        messages.append(turn)
    messages.append({"role": "user", "content": user_content})

    resp = _client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.2,
        max_tokens=1024,
    )

    return {
        "answer":    resp.choices[0].message.content,
        "sources":   chunks if use_docs else [],
        "from_docs": use_docs,
    }
