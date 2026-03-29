import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Send, Bot, User, ChevronDown, FileText, Sparkles, Loader, RotateCcw } from 'lucide-react'
import { streamChat } from '../utils/api'

const SUGGESTIONS = [
  'Explain the key concepts in my documents',
  'What are the main topics covered?',
  'Summarise the most important points',
  'What should I focus on for studying?',
]

function SourceBadge({ source, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 6,
      background: 'var(--accent-bg)', border: '1px solid var(--accent-dim)',
      color: 'var(--accent)', fontSize: 11, fontFamily: 'var(--font-mono)',
      cursor: 'pointer', transition: 'all 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-bg)'}
    >
      <FileText size={10} />
      {source.source} · p.{source.page}
    </button>
  )
}

function SourcePanel({ sources, onClose }) {
  if (!sources?.length) return null
  return (
    <div style={{
      marginTop: 12, padding: 14,
      background: 'var(--bg-2)', borderRadius: 12,
      border: '1px solid var(--border)', animation: 'fadeUp 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.05em' }}>SOURCES</span>
        <button onClick={onClose} style={{ color: 'var(--text-3)', fontSize: 11 }}>hide</button>
      </div>
      {sources.map((s, i) => (
        <div key={i} style={{
          padding: '10px 12px', borderRadius: 8,
          background: 'var(--bg-1)', border: '1px solid var(--border)',
          marginBottom: 8, fontSize: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>
              {s.source}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
              Page {s.page} · score {s.score}
            </span>
          </div>
          <div style={{ color: 'var(--text-2)', lineHeight: 1.6, fontSize: 12 }}>
            {s.text.slice(0, 320)}{s.text.length > 320 ? '…' : ''}
          </div>
        </div>
      ))}
    </div>
  )
}

function Message({ msg }) {
  const [showSources, setShowSources] = useState(false)
  const isUser = msg.role === 'user'

  return (
    <div style={{
      display: 'flex', gap: 14, padding: '4px 0',
      flexDirection: isUser ? 'row-reverse' : 'row',
      animation: 'fadeUp 0.25s ease',
    }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isUser ? 'var(--bg-4)' : 'var(--accent)',
        border: isUser ? '1px solid var(--border-md)' : 'none',
        marginTop: 2,
      }}>
        {isUser
          ? <User size={14} color="var(--text-2)" />
          : <Bot size={14} color="#0d0d0f" strokeWidth={2.5} />
        }
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: '80%', minWidth: 0 }}>
        <div style={{
          padding: isUser ? '10px 14px' : '12px 16px',
          borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
          background: isUser ? 'var(--bg-3)' : 'var(--bg-2)',
          border: `1px solid ${isUser ? 'var(--border-md)' : 'var(--border)'}`,
          fontSize: 14, lineHeight: 1.65,
        }}>
          {msg.streaming ? (
            <span style={{ color: 'var(--text)' }}>
              {msg.content}
              <span style={{ display: 'inline-block', width: 2, height: 14, background: 'var(--accent)', marginLeft: 2, verticalAlign: 'middle', animation: 'pulse 0.8s ease infinite' }} />
            </span>
          ) : (
            <div className="md-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Source + meta row */}
        {!isUser && msg.sources?.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
            {msg.sources.slice(0, 3).map((s, i) => (
              <SourceBadge key={i} source={s} onClick={() => setShowSources(v => !v)} />
            ))}
            <button onClick={() => setShowSources(v => !v)} style={{
              fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3,
            }}>
              {showSources ? 'hide' : `${msg.sources.length} source${msg.sources.length > 1 ? 's' : ''}`}
              <ChevronDown size={11} style={{ transform: showSources ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </button>
          </div>
        )}
        {!isUser && msg.fromGeneral && (
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={10} /> From general knowledge
          </div>
        )}
        {showSources && <SourcePanel sources={msg.sources} onClose={() => setShowSources(false)} />}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 14, padding: '4px 0', animation: 'fadeIn 0.2s ease' }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
        <Bot size={14} color="#0d0d0f" strokeWidth={2.5} />
      </div>
      <div style={{ padding: '12px 16px', borderRadius: '4px 14px 14px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 5 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-3)', animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  )
}

export default function ChatPage({ documents }) {
  const [messages, setMessages]   = useState([])
  const [input, setInput]         = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(text) {
    if (!text.trim() || isLoading) return
    const query = text.trim()
    setInput('')

    const userMsg = { role: 'user', content: query, id: Date.now() }
    const history = messages.map(m => ({ role: m.role, content: m.content }))

    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    const asstId  = Date.now() + 1
    const asstMsg = { role: 'assistant', content: '', id: asstId, streaming: true, sources: [], fromGeneral: false }
    setMessages(prev => [...prev, asstMsg])

    try {
      for await (const chunk of streamChat(query, history)) {
        if (chunk.type === 'token') {
          setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: m.content + chunk.data } : m))
        } else if (chunk.type === 'sources') {
          setMessages(prev => prev.map(m => m.id === asstId ? { ...m, sources: chunk.data } : m))
        } else if (chunk.type === 'meta') {
          setMessages(prev => prev.map(m => m.id === asstId ? { ...m, fromGeneral: !chunk.data.from_docs } : m))
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: `Error: ${err.message}` } : m))
    } finally {
      setMessages(prev => prev.map(m => m.id === asstId ? { ...m, streaming: false } : m))
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  const isEmpty = messages.length === 0

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 28px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>Chat</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>
            {documents.length === 0 ? 'Upload documents to get started' : `${documents.length} document${documents.length > 1 ? 's' : ''} loaded`}
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
            borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text-3)',
            fontSize: 12, transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border-md)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <RotateCcw size={12} /> New chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {isEmpty ? (
          <div style={{ margin: 'auto', textAlign: 'center', maxWidth: 480, animation: 'fadeUp 0.4s ease' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20, background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <Bot size={28} color="#0d0d0f" strokeWidth={2} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, letterSpacing: '-0.03em', marginBottom: 10 }}>
              Ask anything
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
              Upload documents on the left, then ask questions. I'll answer from your material with exact citations or from general knowledge if needed.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => send(s)} style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  color: 'var(--text-2)', fontSize: 12, textAlign: 'left', lineHeight: 1.5,
                  transition: 'all 0.15s', cursor: 'pointer',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hi)'; e.currentTarget.style.color = 'var(--text)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(m => <Message key={m.id} msg={m} />)}
            {isLoading && !messages.find(m => m.streaming) && <TypingIndicator />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-end',
          background: 'var(--bg-2)', borderRadius: 14,
          border: '1px solid var(--border-md)', padding: '10px 10px 10px 16px',
          transition: 'border-color 0.2s',
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--border-hi)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border-md)'}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask a question about your documents…"
            rows={1}
            style={{
              flex: 1, background: 'none', border: 'none', color: 'var(--text)',
              fontSize: 14, lineHeight: 1.6, resize: 'none', maxHeight: 140,
              overflowY: 'auto', padding: '2px 0',
            }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
            }}
          />
          <button onClick={() => send(input)} disabled={!input.trim() || isLoading} style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: input.trim() && !isLoading ? 'var(--accent)' : 'var(--bg-4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}>
            {isLoading
              ? <Loader size={15} color="var(--text-3)" style={{ animation: 'spin 0.8s linear infinite' }} />
              : <Send size={15} color={input.trim() ? '#0d0d0f' : 'var(--text-3)'} />
            }
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8, textAlign: 'center' }}>
          Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  )
}
