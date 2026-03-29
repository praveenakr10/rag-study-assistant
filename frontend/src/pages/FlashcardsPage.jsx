import React, { useState } from 'react'
import { Zap, ChevronLeft, ChevronRight, RotateCcw, Loader, RefreshCw } from 'lucide-react'
import { generateFlashcards } from '../utils/api'

function parseFlashcards(raw) {
  const cards = []
  const blocks = raw.split(/\n(?=Q:)/i)
  for (const block of blocks) {
    const qMatch = block.match(/Q:\s*(.+?)(?=\nA:|$)/is)
    const aMatch = block.match(/A:\s*([\s\S]+?)(?=\n\nQ:|$)/is)
    if (qMatch && aMatch) cards.push({ q: qMatch[1].trim(), a: aMatch[1].trim() })
  }
  return cards.length ? cards : [{ q: raw, a: '' }]
}

function FlipCard({ card, index, total }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div style={{ perspective: '1200px', width: '100%', maxWidth: 560, margin: '0 auto' }}>
      {/* counter */}
      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginBottom: 20, fontFamily: 'var(--font-mono)' }}>
        {index + 1} / {total}
      </div>

      <div
        onClick={() => setFlipped(f => !f)}
        style={{
          height: 280, cursor: 'pointer',
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
        }}
      >
        {/* Front */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
          borderRadius: 20, background: 'var(--bg-2)',
          border: '1px solid var(--border-md)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '32px 40px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--teal)', marginBottom: 20 }}>QUESTION</div>
          <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600, lineHeight: 1.4, color: 'var(--text)' }}>
            {card.q}
          </div>
          <div style={{ marginTop: 28, fontSize: 12, color: 'var(--text-3)' }}>tap to reveal answer</div>
        </div>

        {/* Back */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: 20, background: 'var(--teal-bg)',
          border: '1px solid rgba(90,240,200,0.25)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '32px 40px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--teal)', marginBottom: 20 }}>ANSWER</div>
          <div style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--text)' }}>{card.a}</div>
          <div style={{ marginTop: 28, fontSize: 12, color: 'var(--text-3)' }}>tap to flip back</div>
        </div>
      </div>
    </div>
  )
}

export default function FlashcardsPage() {
  const [topic, setTopic]     = useState('')
  const [count, setCount]     = useState(5)
  const [cards, setCards]     = useState([])
  const [idx, setIdx]         = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function generate() {
    if (!topic.trim()) return
    setLoading(true); setError('')
    try {
      const res = await generateFlashcards(topic.trim(), count)
      const parsed = parseFlashcards(res.result)
      setCards(parsed); setIdx(0)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Zap size={18} color="var(--teal)" />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>Flashcards</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>AI-generated Q&A cards from your documents</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, maxWidth: 640 }}>
          <input
            value={topic} onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generate()}
            placeholder="Topic (e.g. 'photosynthesis', 'World War 2')"
            style={{
              flex: 1, background: 'var(--bg-2)', border: '1px solid var(--border-md)',
              borderRadius: 10, padding: '9px 14px', color: 'var(--text)', fontSize: 14,
            }}
          />
          <select value={count} onChange={e => setCount(+e.target.value)} style={{
            background: 'var(--bg-2)', border: '1px solid var(--border-md)',
            borderRadius: 10, padding: '9px 12px', color: 'var(--text)', fontSize: 13,
          }}>
            {[3,5,7,10].map(n => <option key={n} value={n}>{n} cards</option>)}
          </select>
          <button onClick={generate} disabled={!topic.trim() || loading} style={{
            padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500,
            background: 'var(--teal)', color: '#0d0d0f',
            opacity: !topic.trim() || loading ? 0.5 : 1, transition: 'opacity 0.15s',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            {loading ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Zap size={14} />}
            Generate
          </button>
        </div>

        {error && <div style={{ color: 'var(--rose)', fontSize: 13, marginBottom: 20 }}>{error}</div>}

        {cards.length > 0 && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <FlipCard card={cards[idx]} index={idx} total={cards.length} />

            {/* Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 28 }}>
              <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--bg-2)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: idx === 0 ? 'var(--text-3)' : 'var(--text)',
                opacity: idx === 0 ? 0.4 : 1,
              }}>
                <ChevronLeft size={18} />
              </button>

              {/* Dots */}
              <div style={{ display: 'flex', gap: 6 }}>
                {cards.map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)} style={{
                    width: i === idx ? 20 : 7, height: 7, borderRadius: 4,
                    background: i === idx ? 'var(--teal)' : 'var(--bg-4)',
                    border: 'none', transition: 'all 0.2s',
                  }} />
                ))}
              </div>

              <button onClick={() => setIdx(i => Math.min(cards.length - 1, i + 1))} disabled={idx === cards.length - 1} style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--bg-2)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: idx === cards.length - 1 ? 'var(--text-3)' : 'var(--text)',
                opacity: idx === cards.length - 1 ? 0.4 : 1,
              }}>
                <ChevronRight size={18} />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button onClick={() => { setCards([]); setTopic('') }} style={{
                fontSize: 12, color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <RefreshCw size={12} /> Generate new set
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
