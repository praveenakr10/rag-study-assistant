"""
study_modes.py — flashcard, quiz, summary, ELI5, compare generators
All powered by Groq (free tier)
"""
import os
from groq import Groq
from dotenv import load_dotenv
from retriever import retrieve

load_dotenv()

_client = Groq(api_key=os.environ["GROQ_API_KEY"])
MODEL   = "llama-3.3-70b-versatile"

def _llm(prompt: str, temperature: float = 0.4, max_tokens: int = 1500) -> str:
    res = _client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return res.choices[0].message.content

def _context(topic: str, n: int = 4) -> str:
    chunks = retrieve(topic)[:n]
    if not chunks:
        return f"(No specific document content found for '{topic}'. Answer from general knowledge.)"
    return "\n\n---\n\n".join(f"[{c['source']}, p.{c['page']}]\n{c['text']}" for c in chunks)

def generate_flashcards(topic: str, count: int = 5) -> str:
    ctx = _context(topic)
    return _llm(f"""Based on the study material below, generate exactly {count} flashcards.

Format STRICTLY as:
Q: [question]
A: [answer]

(blank line between cards)

Do NOT add numbering, headers, or any other text.

Study material on "{topic}":
{ctx}""")

def generate_quiz(topic: str, count: int = 3) -> str:
    ctx = _context(topic)
    return _llm(f"""Based on the study material below, create exactly {count} multiple-choice questions about "{topic}".

Format STRICTLY as:
1. [Question text]
A) [option]
B) [option]
C) [option]
D) [option]
Correct answer: [letter]
Explanation: [one sentence]

(blank line between questions)

Study material:
{ctx}""")

def summarise_topic(topic: str) -> str:
    ctx = _context(topic, n=6)
    return _llm(f"""Summarise the following study material about "{topic}".

Requirements:
- Start with a 1-sentence overview
- Use bullet points for key facts and concepts
- End with 2-3 "Key takeaways"
- Keep it under 250 words total

Study material:
{ctx}""")

def eli5Topic(topic: str) -> str:
    ctx = _context(topic)
    return _llm(f"""Explain "{topic}" as simply as possible, as if to a curious 16-year-old with no prior knowledge.

Requirements:
- Use plain everyday language (no jargon without explanation)
- Include a real-world analogy or example
- Keep it conversational and engaging
- Under 200 words

Study material to base this on:
{ctx}""")

def compare_topics(topic_a: str, topic_b: str) -> str:
    ctx_a = _context(topic_a, n=3)
    ctx_b = _context(topic_b, n=3)
    return _llm(f"""Compare and contrast "{topic_a}" and "{topic_b}" based on the study material.

Structure your response as:
## Similarities
- ...

## Key differences
| Aspect | {topic_a} | {topic_b} |
|--------|-----------|-----------|
| ...    | ...       | ...       |

## When to use each / which matters more
...

Study material on {topic_a}:
{ctx_a}

Study material on {topic_b}:
{ctx_b}""")
