import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileText, Trash2, Upload, CheckCircle, AlertCircle, Loader, BookOpen, Zap, Grid, BarChart2, GitCompare } from 'lucide-react'
import { uploadFile, deleteDocument } from '../utils/api'

const MODES = [
  { id: 'chat',       label: 'Chat',        icon: BookOpen,   color: 'var(--accent)' },
  { id: 'flashcards', label: 'Flashcards',  icon: Zap,        color: 'var(--teal)' },
  { id: 'quiz',       label: 'Quiz me',     icon: Grid,       color: 'var(--amber)' },
  { id: 'summary',    label: 'Summary',     icon: BarChart2,  color: 'var(--purple)' },
  { id: 'compare',    label: 'Compare',     icon: GitCompare, color: 'var(--rose)' },
]

function DocItem({ doc, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const ext = doc.name.split('.').pop().toUpperCase()
  const extColors = { PDF: 'var(--rose)', DOCX: 'var(--teal)', PPTX: 'var(--amber)', TXT: 'var(--purple)' }
  const color = extColors[ext] || 'var(--text-2)'

  async function handleDelete() {
    setDeleting(true)
    await onDelete(doc.name)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
      background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)',
      animation: 'fadeUp 0.2s ease',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: `${color}18`,
        border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600, color }}>{ext}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {doc.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
          {doc.chunks} chunks
        </div>
      </div>
      <button onClick={handleDelete} disabled={deleting} style={{
        width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-3)', transition: 'all 0.15s', flexShrink: 0,
        background: deleting ? 'var(--bg-3)' : 'transparent',
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--rose)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
      >
        {deleting ? <Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Trash2 size={13} />}
      </button>
    </div>
  )
}

function UploadItem({ item }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
      background: 'var(--bg-2)', borderRadius: 10, border: '1px solid var(--border)',
      animation: 'fadeUp 0.2s ease',
    }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {item.status === 'done'    && <CheckCircle size={14} color="var(--accent)" />}
        {item.status === 'error'   && <AlertCircle size={14} color="var(--rose)" />}
        {item.status === 'loading' && <Loader size={14} color="var(--text-2)" style={{ animation: 'spin 0.8s linear infinite' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
        {item.status === 'loading' && (
          <div style={{ marginTop: 5, height: 2, background: 'var(--bg-4)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${item.progress}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.2s' }} />
          </div>
        )}
        {item.status === 'error' && <div style={{ fontSize: 11, color: 'var(--rose)', marginTop: 1 }}>{item.error}</div>}
      </div>
    </div>
  )
}

export default function Sidebar({ mode, onModeChange, documents, onDocumentsChange }) {
  const [uploads, setUploads] = useState([])

  const onDrop = useCallback(async (acceptedFiles) => {
    const newUploads = acceptedFiles.map(f => ({ name: f.name, status: 'loading', progress: 0, id: Math.random() }))
    setUploads(prev => [...prev, ...newUploads])

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i]
      const uid  = newUploads[i].id
      try {
        const result = await uploadFile(file, progress => {
          setUploads(prev => prev.map(u => u.id === uid ? { ...u, progress } : u))
        })
        setUploads(prev => prev.map(u => u.id === uid ? { ...u, status: 'done' } : u))
        onDocumentsChange(prev => [...prev.filter(d => d.name !== result.filename), { name: result.filename, chunks: result.chunks }])
        setTimeout(() => setUploads(prev => prev.filter(u => u.id !== uid)), 2500)
      } catch (err) {
        setUploads(prev => prev.map(u => u.id === uid ? { ...u, status: 'error', error: err.message } : u))
        setTimeout(() => setUploads(prev => prev.filter(u => u.id !== uid)), 4000)
      }
    }
  }, [onDocumentsChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'], 'text/plain': ['.txt'] },
  })

  async function handleDelete(name) {
    await deleteDocument(name)
    onDocumentsChange(prev => prev.filter(d => d.name !== name))
  }

  return (
    <aside style={{
      width: 'var(--sidebar-w)', flexShrink: 0, height: '100vh',
      background: 'var(--bg-1)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BookOpen size={16} color="#0d0d0f" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', lineHeight: 1 }}>StudyRAG</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, letterSpacing: '0.05em' }}>AI STUDY ASSISTANT</div>
          </div>
        </div>
      </div>

      {/* Modes */}
      <div style={{ padding: '14px 12px 10px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 4 }}>MODES</div>
        {MODES.map(m => {
          const Icon = m.icon
          const active = mode === m.id
          return (
            <button key={m.id} onClick={() => onModeChange(m.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 9, marginBottom: 2,
              background: active ? `${m.color}14` : 'transparent',
              border: active ? `1px solid ${m.color}30` : '1px solid transparent',
              color: active ? m.color : 'var(--text-2)',
              fontWeight: active ? 500 : 400, fontSize: 13,
              transition: 'all 0.15s', textAlign: 'left',
            }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-2)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon size={15} />
              {m.label}
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 12px' }}>
        {/* Drop zone */}
        <div {...getRootProps()} style={{
          border: `1.5px dashed ${isDragActive ? 'var(--accent)' : 'var(--border-md)'}`,
          borderRadius: 12,
          padding: '16px 12px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragActive ? 'var(--accent-bg)' : 'var(--bg-2)',
          transition: 'all 0.2s',
          marginBottom: 12,
        }}>
          <input {...getInputProps()} />
          <Upload size={18} color={isDragActive ? 'var(--accent)' : 'var(--text-3)'} style={{ margin: '0 auto 6px' }} />
          <div style={{ fontSize: 11, color: isDragActive ? 'var(--accent)' : 'var(--text-2)', fontWeight: 500 }}>
            {isDragActive ? 'Drop to upload' : 'Drop files or click'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>PDF · DOCX · PPTX · TXT</div>
        </div>

        {/* Upload queue */}
        {uploads.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            {uploads.map(u => <UploadItem key={u.id} item={u} />)}
          </div>
        )}

        {/* Doc list */}
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 4 }}>
          DOCUMENTS {documents.length > 0 && `(${documents.length})`}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-3)', fontSize: 12 }}>
              <FileText size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              No documents yet
            </div>
          ) : (
            documents.map(d => <DocItem key={d.name} doc={d} onDelete={handleDelete} />)
          )}
        </div>
      </div>
    </aside>
  )
}
