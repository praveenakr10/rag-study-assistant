import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import ChatPage from './pages/ChatPage.jsx'
import FlashcardsPage from './pages/FlashcardsPage.jsx'
import QuizPage from './pages/QuizPage.jsx'
import SummaryPage from './pages/SummaryPage.jsx'
import { listDocuments } from './utils/api'

export default function App() {
  const [mode, setMode]       = useState('chat')
  const [documents, setDocs]  = useState([])

  useEffect(() => {
    listDocuments()
      .then(data => setDocs(data.documents || []))
      .catch(() => {})
  }, [])

  const pages = {
    chat:       <ChatPage documents={documents} />,
    flashcards: <FlashcardsPage />,
    quiz:       <QuizPage />,
    summary:    <SummaryPage subMode="summary" />,
    compare:    <SummaryPage subMode="compare" />,
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        mode={mode}
        onModeChange={setMode}
        documents={documents}
        onDocumentsChange={setDocs}
      />
      <main style={{ flex: 1, display: 'flex', minWidth: 0 }}>
        {pages[mode] || pages.chat}
      </main>
    </div>
  )
}
