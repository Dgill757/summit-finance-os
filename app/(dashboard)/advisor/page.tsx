'use client'

import { useState } from 'react'
import { Bot, Send } from 'lucide-react'
import { TopBar } from '@/components/layout/top-bar'

const prompts = ["What's my net worth?", 'How much did I spend on food last month?', 'Am I on track for my goals?', 'What subscriptions should I cancel?']

export default function AdvisorPage() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: "Hello! I'm your Summit AI Financial Advisor. I have full access to your financial data. Ask me anything." }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendMessage(content: string) {
    if (!content.trim()) return
    const nextMessages = [...messages, { role: 'user', content }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: nextMessages }) })
      const data = await res.json()
      setMessages([...nextMessages, { role: 'assistant', content: data.message || data.error || 'No response returned.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full min-h-screen flex-col">
      <TopBar title="AI Advisor" subtitle="Ask financial questions against your live Summit data." />
      <div className="flex flex-1 flex-col px-6 py-6">
        <div className="mb-4 flex flex-wrap gap-2">{prompts.map((prompt) => <button key={prompt} onClick={() => sendMessage(prompt)} className="rounded-full border border-border bg-panel px-4 py-2 text-sm text-secondary transition hover:border-teal/30 hover:text-primary">{prompt}</button>)}</div>
        <div className="flex-1 space-y-4 overflow-y-auto rounded-3xl border border-border bg-surface p-5 shadow-card">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={message.role === 'user' ? 'max-w-[70%] rounded-3xl bg-teal px-5 py-4 text-sm text-canvas' : 'max-w-[70%] rounded-3xl border border-border bg-panel px-5 py-4 text-sm text-primary'}>
                {message.role === 'assistant' && <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted"><Bot size={14} className="text-teal" /> Summit AI</div>}
                {message.content}
              </div>
            </div>
          ))}
          {loading && <div className="max-w-[70%] rounded-3xl border border-border bg-panel px-5 py-4 text-sm text-secondary">Thinking...</div>}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); void sendMessage(input) }} className="mt-4 flex gap-3">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about spending, net worth, budgets, goals, or MRR..." className="flex-1 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-primary outline-none placeholder:text-muted" />
          <button className="inline-flex items-center gap-2 rounded-2xl bg-teal px-5 py-3 text-sm font-medium text-canvas"><Send size={15} /> Send</button>
        </form>
      </div>
    </div>
  )
}
