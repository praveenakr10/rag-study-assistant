import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Grid, Loader, CheckCircle, XCircle, Award } from 'lucide-react'
import { generateQuiz } from '../utils/api'

function parseQuiz(raw) {
  const questions = []
  const blocks = raw.split(/\n(?=\d+[\.\)])/g)
  for (const block of blocks) {
    const qMatch = block.match(/^\d+[\.\)]\s*(.+?)(?=\nA[\.\)]|\nOption A|\n[A-D][\.\)])/is)
    if (!qMatch) continue
    const q = qMatch[1].trim()
    const opts = []
    const optRe = /^([A-D])[\.\)]\s*(.+)/gim
    let m
    while ((m = optRe.exec(block)) !== null) opts.push({ letter: m[1], text: m[2].trim() })
    const ansMatch = block.match(/(?:correct answer|answer)[:\s]+([A-D])/i)
    const expMatch = block.match(/(?:explanation)[:\s]+([\s\S]+?)(?=\n\n|\n\d+[\.\)]|$)/i)
    if (q && opts.length >= 2) {
      questions.push({ q, options: opts, answer: ansMatch?.[1]?.toUpperCase(), explanation: expMatch?.[1]?.trim() })
    }
  }
  return questions
}

function QuizQuestion({ question, index, total, onNext, isLast }) {
  const [selected, setSelected]   = useState(null)
  const [revealed, setRevealed]   = useState(false)

  function choose(letter) {
    if (revealed) return
    setSelected(letter)
    setRevealed(true)
    onNext(letter === question.answer)
  }

  const optionColors = (letter) => {
    if (!revealed) return { bg: 'var(--bg-2)', border: 'var(--border)', color: 'var(--text)' }
    if (letter === question.answer) return { bg: 'rgba(90,240,200,0.12)', border: 'rgba(90,240,200,0.4)', color: 'var(--teal)' }
    if (letter === selected) return { bg: 'rgba(240,90,122,0.12)', border: 'rgba(240,90,122,0.4)', color: 'var(--rose)' }
    return { bg: 'var(--bg-1)', border: 'var(--border)', color: 'var(--text-3)' }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', animation: 'fadeUp 0.3s ease' }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 16, fontFamily: 'var(--font-mono)' }}>
        Question {index + 1} of {total}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, lineHeight: 1.4, marginBottom: 28, letterSpacing: '-0.02em' }}>
        {question.q}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {question.options.map(opt => {
          const style = optionColors(opt.letter)
          return (
            <button key={opt.letter} onClick={() => choose(opt.letter)} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
              borderRadius: 12, background: style.bg, border: `1px solid ${style.border}`,
              color: style.color, textAlign: 'left', cursor: revealed ? 'default' : 'pointer',
              transition: 'all 0.2s', fontSize: 14,
            }}
              onMouseEnter={e => { if (!revealed) e.currentTarget.style.borderColor = 'var(--border-hi)' }}
              onMouseLeave={e => { if (!revealed) e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <span style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: style.border !== 'var(--border)' ? `${style.border}30` : 'var(--bg-4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12,
              }}>
                {opt.letter}
              </span>
              {opt.text}
              {revealed && opt.letter === question.answer && <CheckCircle size={16} color="var(--teal)" style={{ marginLeft: 'auto' }} />}
              {revealed && opt.letter === selected && opt.letter !== question.answer && <XCircle size={16} color="var(--rose)" style={{ marginLeft: 'auto' }} />}
            </button>
          )
        })}
      </div>

      {revealed && question.explanation && (
        <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 12, background: 'var(--bg-2)', border: '1px solid var(--border)', animation: 'fadeUp 0.2s ease' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--amber)', marginBottom: 6, letterSpacing: '0.05em' }}>EXPLANATION</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{question.explanation}</div>
        </div>
      )}
    </div>
  )
}

function ScoreScreen({ score, total, onRetry }) {
  const pct = Math.round(score / total * 100)
  const grade = pct >= 80 ? { label: 'Excellent!', color: 'var(--teal)' } : pct >= 60 ? { label: 'Good job!', color: 'var(--amber)' } : { label: 'Keep studying!', color: 'var(--rose)' }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', animation: 'fadeUp 0.4s ease' }}>
      <div style={{
        width: 100, height: 100, borderRadius: '50%', margin: '0 auto 24px',
        background: `${grade.color}18`, border: `2px solid ${grade.color}40`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: grade.color }}>{pct}%</div>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.03em' }}>{grade.label}</div>
      <div style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 32 }}>
        You got <strong style={{ color: 'var(--text)' }}>{score}</strong> out of <strong style={{ color: 'var(--text)' }}>{total}</strong> questions correct
      </div>
      <button onClick={onRetry} style={{
        padding: '10px 24px', borderRadius: 10, background: 'var(--amber)', color: '#0d0d0f',
        fontWeight: 600, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8,
      }}>
        <Award size={15} /> Try Again
      </button>
    </div>
  )
}

export default function QuizPage() {
  const [topic, setTopic]     = useState('')
  const [count, setCount]     = useState(3)
  const [questions, setQ]     = useState([])
  const [current, setCurrent] = useState(0)
  const [score, setScore]     = useState(0)
  const [done, setDone]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function generate() {
    if (!topic.trim()) return
    setLoading(true); setError('')
    try {
      const res = await generateQuiz(topic.trim(), count)
      const parsed = parseQuiz(res.result)
      if (!parsed.length) throw new Error('Could not parse quiz. Try a more specific topic.')
      setQ(parsed); setCurrent(0); setScore(0); setDone(false)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  function onNext(correct) {
    if (correct) setScore(s => s + 1)
    setTimeout(() => {
      if (current + 1 >= questions.length) setDone(true)
      else setCurrent(c => c + 1)
    }, 1200)
  }

  function reset() { setQ([]); setTopic(''); setDone(false) }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Grid size={18} color="var(--amber)" />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>Quiz Me</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Test your knowledge with AI-generated questions</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        {questions.length === 0 ? (
          <div style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input
                value={topic} onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generate()}
                placeholder="Topic to quiz yourself on…"
                style={{
                  flex: 1, background: 'var(--bg-2)', border: '1px solid var(--border-md)',
                  borderRadius: 10, padding: '9px 14px', color: 'var(--text)', fontSize: 14,
                }}
              />
              <select value={count} onChange={e => setCount(+e.target.value)} style={{
                background: 'var(--bg-2)', border: '1px solid var(--border-md)',
                borderRadius: 10, padding: '9px 12px', color: 'var(--text)', fontSize: 13,
              }}>
                {[2, 3, 5, 8].map(n => <option key={n} value={n}>{n} Qs</option>)}
              </select>
              <button onClick={generate} disabled={!topic.trim() || loading} style={{
                padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                background: 'var(--amber)', color: '#0d0d0f',
                opacity: !topic.trim() || loading ? 0.5 : 1,
                display: 'flex', alignItems: 'center', gap: 7,
              }}>
                {loading ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Grid size={14} />}
                Start
              </button>
            </div>
            {error && <div style={{ color: 'var(--rose)', fontSize: 13 }}>{error}</div>}
          </div>
        ) : done ? (
          <ScoreScreen score={score} total={questions.length} onRetry={reset} />
        ) : (
          <>
            {/* Progress bar */}
            <div style={{ height: 3, background: 'var(--bg-4)', borderRadius: 2, marginBottom: 32, maxWidth: 600, margin: '0 auto 32px' }}>
              <div style={{ height: '100%', width: `${(current / questions.length) * 100}%`, background: 'var(--amber)', borderRadius: 2, transition: 'width 0.4s ease' }} />
            </div>
            <QuizQuestion
              question={questions[current]}
              index={current}
              total={questions.length}
              onNext={onNext}
              isLast={current === questions.length - 1}
            />
          </>
        )}
      </div>
    </div>
  )
}
