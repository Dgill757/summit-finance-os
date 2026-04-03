'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Send, Sparkles } from 'lucide-react'

type ChatAction = {
  success?: boolean
  action_type?: string
  message?: string
  goal?: { id?: string; name?: string; target_amount?: number }
  bill?: { id?: string; name?: string; amount?: number }
}

type ChatMessage = {
  role: 'assistant' | 'user'
  content: string
  actions?: ChatAction[]
}

const ACTION_PROMPTS = [
  {
    label: '🎯 Suggest Goals For Me',
    prompt:
      'Based on my spending patterns and financial situation, suggest 3 specific goals I should create right now. For each one, tell me the target amount, why it matters, and create it for me.',
  },
  {
    label: '✂️ What Should I Cut?',
    prompt:
      'Analyze my bills and subscriptions. Tell me exactly which ones to cancel or reduce, how much I would save, and what I should do with that extra money.',
  },
  {
    label: '📊 Full Financial Report',
    prompt:
      "Give me a complete financial health report. Include my net worth, this month's income vs expenses, savings rate, top spending categories, goal progress, and your top 3 recommendations.",
  },
  {
    label: '💡 Build My Savings Plan',
    prompt:
      'I want to save $500 more per month. Tell me exactly what to cut, what to keep, and how to get there. Be specific with dollar amounts.',
  },
  {
    label: '📋 Analyze My Bills',
    prompt:
      'Pull up all my recurring charges and bills. Tell me what my total monthly fixed costs are, which ones are essential, which are wasteful, and what my monthly "cost of staying alive" is.',
  },
  {
    label: '🏆 Review My Goals',
    prompt:
      "Review all my active goals. Tell me which ones I'm on track for, which ones are behind, and give me specific steps to accelerate each one.",
  },
  {
    label: '📈 How Do I Reach $10K MRR?',
    prompt:
      'Based on my current business metrics, how do I reach $10,000 MRR at Summit Marketing Group? Tell me how many clients I need, at what price point, and what to focus on.',
  },
  {
    label: '🔍 Find Spending Habits',
    prompt:
      'Analyze my last 90 days of transactions. Tell me my biggest spending habits, patterns I might not have noticed, and which habits are costing me the most money.',
  },
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

function actionSummary(action: ChatAction) {
  if (action.action_type === 'goal_created' && action.goal) {
    return {
      title: `Goal Created: ${action.goal.name}`,
      detail: `$${Number(action.goal.target_amount || 0).toLocaleString()} target`,
      href: '/goals',
      cta: 'Open Goals',
    }
  }
  if (action.action_type === 'goal_deposit_added' && action.goal) {
    return {
      title: `Deposit Added: ${action.goal.name}`,
      detail: action.message || 'Goal updated successfully.',
      href: '/goals',
      cta: 'View Goal',
    }
  }
  if (action.action_type === 'budget_created') {
    return {
      title: 'Budget Updated',
      detail: action.message || 'Budget saved successfully.',
      href: '/budgets',
      cta: 'Open Budgets',
    }
  }
  if (action.action_type === 'bill_added' && action.bill) {
    return {
      title: `Bill Added: ${action.bill.name}`,
      detail: `$${Number(action.bill.amount || 0).toLocaleString()} per month`,
      href: '/bills',
      cta: 'Open Bills',
    }
  }
  return null
}

export function AdvisorContent({ financialContext, userId }: { financialContext: Record<string, unknown>; userId: string }) {
  const storageKey = `summit-advisor-${userId}`
  const openingMessage = useMemo(() => {
    const netWorth = Number(financialContext.net_worth || 0)
    const expenses = Number(financialContext.month_expenses || 0)
    const savingsRate = Number(financialContext.savings_rate || 0)
    const insight =
      savingsRate < 10
        ? 'Your savings rate is tight. Your fastest win is reducing recurring monthly drag.'
        : 'You have room to move. The best next step is directing surplus cash into a priority goal.'
    return `Hey Dan! I've reviewed your finances. Your net worth is $${netWorth.toLocaleString()}, you've spent $${expenses.toLocaleString()} this month with a ${savingsRate}% savings rate. ${insight} What do you want to dig into?`
  }, [financialContext])

  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: openingMessage }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (!saved) return
    try {
      setMessages(JSON.parse(saved) as ChatMessage[])
    } catch {}
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
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({ role: message.role, content: message.content })),
          financialContext,
        }),
      })
      const data = await response.json()
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: data.message || data.error || 'I could not generate a response.',
          actions: data.actions_taken || [],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col p-6">
      <div className="mb-4 overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2">
          {ACTION_PROMPTS.map((item) => (
            <button
              key={item.label}
              onClick={() => void sendMessage(item.prompt)}
              className="rounded-full border border-border bg-panel px-3 py-1.5 text-xs text-secondary transition hover:border-teal/30 hover:text-primary"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto rounded-[28px] border border-border bg-surface p-5 shadow-card">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={message.role === 'user' ? 'max-w-[80%] rounded-[24px] bg-teal px-5 py-4 text-sm text-canvas' : 'max-w-[80%] space-y-3 rounded-[24px] border border-border bg-panel px-5 py-4 text-sm text-secondary'}>
              {message.role === 'assistant' && (
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                  <Bot size={14} className="text-teal" />
                  Summit AI
                </div>
              )}
              {renderRichText(message.content)}
              {message.actions?.map((action, actionIndex) => {
                const summary = actionSummary(action)
                if (!summary) return null
                return (
                  <div key={`${index}-${actionIndex}`} className="rounded-2xl border border-teal/20 bg-teal-bg p-4 text-sm text-primary">
                    <div className="flex items-center gap-2 text-teal">
                      <Sparkles size={14} />
                      <span className="font-semibold">{summary.title}</span>
                    </div>
                    <div className="mt-2 text-secondary">{summary.detail}</div>
                    <Link href={summary.href} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-teal/30 px-3 py-2 text-xs font-semibold text-teal transition hover:border-teal/40">
                      {summary.cta}
                    </Link>
                  </div>
                )
              })}
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
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask the AI to analyze, create, update, or plan..."
          className="w-full rounded-xl border border-border bg-panel px-4 py-3 text-sm text-primary placeholder:text-muted focus:border-teal/40 focus:outline-none focus:ring-1 focus:ring-teal/30"
        />
        <button className="flex items-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-canvas transition-all hover:bg-teal/90">
          <Send size={15} />
          Send
        </button>
      </form>
    </div>
  )
}
