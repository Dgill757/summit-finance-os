'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Send } from 'lucide-react'

const SUGGESTED_PROMPTS = [
  "What's my biggest spending category?",
  'Am I on track for my goals?',
  'What subscriptions should I cancel?',
  'How do I save $500 more per month?',
  'Analyze my spending habits',
  'What should I cut to hit my goals faster?',
]

function renderRichText(content: string) {
  return content.split('\n').map((line, index) => {
    const parts = line.split(/(\*\*.*?\*\*)/g).filter(Boolean)
    return (
      <p key={index} className="mb-2 last:mb-0">
        {parts.map((part, i) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={i} className="font-semibold text-primary">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
      </p>
    )
  })
}

export function AdvisorContent({ financialContext, userId }: { financialContext: any; userId: string }) {
  const storageKey = `summit-advisor-${userId}`
  const insight = useMemo(() => {
    const netWorth = Number(financialContext.net_worth || 0)
    const expenses = Number(financialContext.month_expenses || 0)
    const savingsRate = Number(financialContext.savings_rate || 0)
    const defaultInsight =
      savingsRate < 10
        ? 'Your savings rate is tight this month. Tightening one recurring expense category would create the fastest improvement.'
        : 'You have positive momentum this month. The highest-return move is directing surplus cash toward your highest-priority goal.'
    return `Hey Dan! I've reviewed your finances. Your net worth is $${netWorth.toLocaleString()}, you've spent $${expenses.toLocaleString()} this month with a ${savingsRate}% savings rate. ${defaultInsight} What do you want to dig into?`
  }, [financialContext])
  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; content: string }[]>([{ role: 'assistant', content: insight }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        setMessages(JSON.parse(saved))
      } catch {}
    }
  }, [storageKey])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages))
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, storageKey])

  async function sendMessage(content: string) {
    if (!content.trim()) return
    const nextMessages = [...messages, { role: 'user' as const, content }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, financialContext }),
      })
      const data = await response.json()
      setMessages([...nextMessages, { role: 'assistant', content: data.message || data.error || 'I could not generate a response.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col p-6">
      <div className="mb-4 flex flex-wrap gap-2">
        {messages.length <= 1 &&
          SUGGESTED_PROMPTS.map((prompt) => (
            <button key={prompt} onClick={() => void sendMessage(prompt)} className="rounded-full border border-border bg-panel px-4 py-2 text-sm text-secondary transition hover:border-teal/30 hover:text-primary">
              {prompt}
            </button>
          ))}
      </div>
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto rounded-[28px] border border-border bg-surface p-5 shadow-card">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={message.role === 'user' ? 'max-w-[78%] rounded-[24px] bg-teal px-5 py-4 text-sm text-canvas' : 'max-w-[78%] rounded-[24px] border border-border bg-panel px-5 py-4 text-sm text-secondary'}>
              {message.role === 'assistant' && (
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                  <Bot size={14} className="text-teal" />
                  Summit AI
                </div>
              )}
              {renderRichText(message.content)}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-[24px] border border-border bg-panel px-5 py-4 text-sm text-secondary">
              Analyzing your finances<span className="animate-pulse">...</span>
            </div>
          </div>
        )}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void sendMessage(input)
        }}
        className="mt-4 flex gap-3"
      >
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about spending, goals, subscriptions, net worth, or planning..." className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30" />
        <button className="flex items-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-canvas hover:bg-teal/90 transition-all">
          <Send size={15} />
          Send
        </button>
      </form>
    </div>
  )
}
