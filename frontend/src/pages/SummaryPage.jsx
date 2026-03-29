import React, { useState } from 'react'
import { BarChart2, GitCompare, Sparkles } from 'lucide-react'
import { Button, TextInput, MarkdownResult, ErrorBox, PageHeader, PillTabs } from '../components/UI.jsx'
import { summariseTopic, eli5Topic, compareTopics } from '../utils/api'

const SUMMARY_TABS = [
  { id: 'summary', label: 'Summary',  icon: BarChart2, color: 'var(--purple)' },
  { id: 'eli5',    label: 'ELI5',     icon: Sparkles,  color: 'var(--amber)' },
]

function SummaryPanel() {
  const [topic,   setTopic]   = useState('')
  const [subMode, setSubMode] = useState('summary')
  const [result,  setResult]  = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function run() {
    if (!topic.trim()) return
    setLoading(true); setError(''); setResult('')
    try {
      const fn  = subMode === 'summary' ? summariseTopic : eli5Topic
      const res = await fn(topic.trim())
      setResult(res.result)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const btnBg = subMode === 'summary' ? 'var(--purple)' : 'var(--amber)'
  const accent = subMode === 'summary' ? 'var(--purple)' : 'var(--amber)'

  return (
    <div style={{ maxWidth: 680 }}>
      <PillTabs
        tabs={SUMMARY_TABS}
        active={subMode}
        onChange={v => { setSubMode(v); setResult(''); setError('') }}
      />
      <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
        <TextInput
          value={topic}
          onChange={setTopic}
          onEnter={run}
          placeholder={subMode === 'summary' ? 'Topic to summarise from your docs…' : 'Topic to explain simply…'}
        />
        <Button
          icon={subMode === 'summary' ? BarChart2 : Sparkles}
          color={btnBg}
          onClick={run}
          loading={loading}
          disabled={!topic.trim()}
        >
          Go
        </Button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>
        {subMode === 'eli5'
          ? 'Explains using simple words, analogies, and a real-world example.'
          : 'Pulls the key points from your uploaded documents.'}
      </div>
      <ErrorBox message={error} />
      <MarkdownResult content={result} accentColor={accent} />
    </div>
  )
}

function ComparePanel() {
  const [topicA,  setA]      = useState('')
  const [topicB,  setB]      = useState('')
  const [result,  setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function run() {
    if (!topicA.trim() || !topicB.trim()) return
    setLoading(true); setError(''); setResult('')
    try {
      const res = await compareTopics(topicA.trim(), topicB.trim())
      setResult(res.result)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, paddingLeft: 2 }}>TOPIC A</div>
          <TextInput value={topicA} onChange={setA} placeholder="e.g. Mitosis" style={{ width: '100%' }} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, paddingLeft: 2 }}>TOPIC B</div>
          <TextInput value={topicB} onChange={setB} onEnter={run} placeholder="e.g. Meiosis" style={{ width: '100%' }} />
        </div>
      </div>
      <Button
        icon={GitCompare}
        color="var(--rose)"
        onClick={run}
        loading={loading}
        disabled={!topicA.trim() || !topicB.trim()}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        Compare these topics
      </Button>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
        Retrieves relevant chunks from each topic and compares them side by side.
      </div>
      <ErrorBox message={error} />
      <MarkdownResult content={result} accentColor="var(--rose)" />
    </div>
  )
}

export default function SummaryPage({ subMode: initialMode = 'summary' }) {
  const isCompare = initialMode === 'compare'
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <PageHeader
        icon={isCompare ? GitCompare : BarChart2}
        color={isCompare ? 'var(--rose)' : 'var(--purple)'}
        title={isCompare ? 'Compare Topics' : 'Summarise'}
        subtitle={isCompare
          ? 'Contrast two topics side by side from your uploaded documents'
          : 'Summarise any topic or get a simple beginner-friendly explanation'}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
        {isCompare ? <ComparePanel /> : <SummaryPanel />}
      </div>
    </div>
  )
}
