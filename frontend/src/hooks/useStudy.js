import { useState, useCallback, useRef } from 'react'
import { uploadFile, deleteDocument, listDocuments } from '../utils/api'

export function useDocuments() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading]     = useState(false)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listDocuments()
      setDocuments(data.documents || [])
    } catch (_) {}
    finally { setLoading(false) }
  }, [])

  const addDoc = useCallback((doc) => {
    setDocuments(prev => [...prev.filter(d => d.name !== doc.name), doc])
  }, [])

  const removeDoc = useCallback(async (name) => {
    await deleteDocument(name)
    setDocuments(prev => prev.filter(d => d.name !== name))
  }, [])

  return { documents, setDocuments, loading, fetchDocs, addDoc, removeDoc }
}

export function useUpload(onSuccess) {
  const [uploads, setUploads] = useState([])

  const upload = useCallback(async (files) => {
    const newItems = files.map(f => ({
      id: `${f.name}-${Date.now()}`,
      name: f.name,
      status: 'loading',
      progress: 0,
    }))
    setUploads(prev => [...prev, ...newItems])

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const uid  = newItems[i].id
      try {
        const result = await uploadFile(file, progress => {
          setUploads(prev => prev.map(u => u.id === uid ? { ...u, progress } : u))
        })
        setUploads(prev => prev.map(u => u.id === uid ? { ...u, status: 'done' } : u))
        onSuccess?.({ name: result.filename, chunks: result.chunks })
        setTimeout(() => setUploads(prev => prev.filter(u => u.id !== uid)), 2500)
      } catch (err) {
        setUploads(prev => prev.map(u => u.id === uid ? { ...u, status: 'error', error: err.message } : u))
        setTimeout(() => setUploads(prev => prev.filter(u => u.id !== uid)), 4000)
      }
    }
  }, [onSuccess])

  return { uploads, upload }
}

export function useChat() {
  const [messages, setMessages]   = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef(null)

  const sendMessage = useCallback(async (query, streamFn) => {
    if (!query.trim() || isLoading) return false

    const history = messages.map(m => ({ role: m.role, content: m.content }))
    const userMsg = { role: 'user', content: query.trim(), id: Date.now() }
    const asstId  = Date.now() + 1
    const asstMsg = { role: 'assistant', content: '', id: asstId, streaming: true, sources: [], fromGeneral: false }

    setMessages(prev => [...prev, userMsg, asstMsg])
    setIsLoading(true)

    try {
      for await (const chunk of streamFn(query.trim(), history)) {
        if (chunk.type === 'token') {
          setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: m.content + chunk.data } : m))
        } else if (chunk.type === 'sources') {
          setMessages(prev => prev.map(m => m.id === asstId ? { ...m, sources: chunk.data } : m))
        } else if (chunk.type === 'meta') {
          setMessages(prev => prev.map(m => m.id === asstId ? { ...m, fromGeneral: !chunk.data.from_docs } : m))
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === asstId ? { ...m, content: `Something went wrong: ${err.message}` } : m
      ))
    } finally {
      setMessages(prev => prev.map(m => m.id === asstId ? { ...m, streaming: false } : m))
      setIsLoading(false)
    }
    return true
  }, [messages, isLoading])

  const clearMessages = useCallback(() => setMessages([]), [])

  return { messages, isLoading, sendMessage, clearMessages }
}
