const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res
}

export async function uploadFile(file, onProgress) {
  const form = new FormData()
  form.append('file', file)
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = e => e.lengthComputable && onProgress(Math.round(e.loaded / e.total * 100))
    xhr.onload  = () => resolve(JSON.parse(xhr.responseText))
    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.open('POST', `${BASE}/upload`)
    xhr.send(form)
  })
}

export async function deleteDocument(filename) {
  return request(`/documents/${encodeURIComponent(filename)}`, { method: 'DELETE' }).then(r => r.json())
}

export async function listDocuments() {
  return request('/documents').then(r => r.json())
}

export async function* streamChat(query, history) {
  const res = await request('/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, history }),
  })
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') return
        try { yield JSON.parse(data) } catch {}
      }
    }
  }
}

export async function generateFlashcards(topic, count) {
  return request('/study/flashcards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, count }),
  }).then(r => r.json())
}

export async function generateQuiz(topic, count) {
  return request('/study/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, count }),
  }).then(r => r.json())
}

export async function summariseTopic(topic) {
  return request('/study/summarise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic }),
  }).then(r => r.json())
}

export async function eli5Topic(topic) {
  return request('/study/eli5', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic }),
  }).then(r => r.json())
}

export async function compareTopics(topicA, topicB) {
  return request('/study/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic_a: topicA, topic_b: topicB }),
  }).then(r => r.json())
}
