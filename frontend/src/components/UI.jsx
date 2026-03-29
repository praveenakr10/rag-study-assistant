import React from 'react'
import { Loader } from 'lucide-react'

/* ── Button ───────────────────────────────────────────────────────────────── */
export function Button({ children, onClick, disabled, color = 'var(--accent)', textColor = '#0d0d0f', icon: Icon, loading, style = {}, ...props }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '9px 18px', borderRadius: 10,
        background: color, color: textColor,
        fontSize: 13, fontWeight: 500,
        opacity: disabled || loading ? 0.5 : 1,
        transition: 'opacity 0.15s, transform 0.1s',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        border: 'none',
        ...style,
      }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.opacity = '0.88' }}
      onMouseLeave={e => { if (!disabled && !loading) e.currentTarget.style.opacity = '1' }}
      onMouseDown={e => { if (!disabled && !loading) e.currentTarget.style.transform = 'scale(0.97)' }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
      {...props}
    >
      {loading
        ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
        : Icon && <Icon size={14} />
      }
      {children}
    </button>
  )
}

/* ── TextInput ────────────────────────────────────────────────────────────── */
export function TextInput({ value, onChange, onEnter, placeholder, style = {} }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && onEnter?.()}
      placeholder={placeholder}
      style={{
        flex: 1, background: 'var(--bg-2)',
        border: '1px solid var(--border-md)',
        borderRadius: 10, padding: '9px 14px',
        color: 'var(--text)', fontSize: 14,
        transition: 'border-color 0.15s',
        ...style,
      }}
      onFocus={e => e.target.style.borderColor = 'var(--border-hi)'}
      onBlur={e => e.target.style.borderColor = 'var(--border-md)'}
    />
  )
}

/* ── Select ───────────────────────────────────────────────────────────────── */
export function Select({ value, onChange, options, style = {} }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: 'var(--bg-2)', border: '1px solid var(--border-md)',
        borderRadius: 10, padding: '9px 12px',
        color: 'var(--text)', fontSize: 13,
        cursor: 'pointer',
        ...style,
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

/* ── Card ─────────────────────────────────────────────────────────────────── */
export function Card({ children, accent, style = {} }) {
  return (
    <div style={{
      background: 'var(--bg-2)',
      border: `1px solid ${accent ? `${accent}28` : 'var(--border)'}`,
      borderRadius: 16, padding: '20px 24px',
      animation: 'fadeUp 0.3s ease',
      ...style,
    }}>
      {children}
    </div>
  )
}

/* ── PageHeader ───────────────────────────────────────────────────────────── */
export function PageHeader({ icon: Icon, color, title, subtitle }) {
  return (
    <div style={{
      padding: '16px 28px', borderBottom: '1px solid var(--border)', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
        <Icon size={18} color={color} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>
          {title}
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', paddingLeft: 28 }}>{subtitle}</div>
    </div>
  )
}

/* ── EmptyState ───────────────────────────────────────────────────────────── */
export function EmptyState({ icon: Icon, title, body, color = 'var(--accent)' }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', animation: 'fadeUp 0.4s ease' }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: `${color}18`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 18px',
      }}>
        <Icon size={24} color={color} />
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, maxWidth: 340, margin: '0 auto' }}>
        {body}
      </div>
    </div>
  )
}

/* ── ErrorBox ─────────────────────────────────────────────────────────────── */
export function ErrorBox({ message }) {
  if (!message) return null
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 10,
      background: 'var(--rose-bg)', border: '1px solid rgba(240,90,122,0.3)',
      color: 'var(--rose)', fontSize: 13, marginTop: 12,
      animation: 'fadeIn 0.2s ease',
    }}>
      {message}
    </div>
  )
}

/* ── Markdown result ──────────────────────────────────────────────────────── */
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function MarkdownResult({ content, accentColor }) {
  if (!content) return null
  return (
    <Card accent={accentColor} style={{ marginTop: 24 }}>
      <div className="md-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </Card>
  )
}

/* ── Pill tabs ────────────────────────────────────────────────────────────── */
export function PillTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
      {tabs.map(t => {
        const Icon = t.icon
        const isActive = active === t.id
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 9,
            background: isActive ? `${t.color}14` : 'transparent',
            border: `1px solid ${isActive ? `${t.color}40` : 'var(--border)'}`,
            color: isActive ? t.color : 'var(--text-2)',
            fontSize: 13, fontWeight: isActive ? 500 : 400,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-3)' }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
          >
            {Icon && <Icon size={13} />}
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
