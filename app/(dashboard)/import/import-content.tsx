'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/formatters'

const BANK_PRESETS: Record<string, { date: string; description: string; amount: string }> = {
  bank_of_america: { date: 'Date', description: 'Description', amount: 'Amount' },
  chase: { date: 'Transaction Date', description: 'Description', amount: 'Amount' },
  wells_fargo: { date: 'Date', description: 'Description', amount: 'Amount' },
  citibank: { date: 'Date', description: 'Description', amount: 'Debit' },
  capital_one: { date: 'Transaction Date', description: 'Transaction Description', amount: 'Transaction Amount' },
  discover: { date: 'Trans. Date', description: 'Description', amount: 'Amount' },
  amex: { date: 'Date', description: 'Description', amount: 'Amount' },
  usaa: { date: 'Date', description: 'Description', amount: 'Amount' },
  navy_federal: { date: 'Transaction Date', description: 'Transaction Type', amount: 'Debit Amount' },
  custom: { date: '', description: '', amount: '' },
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/)
  const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))
  const rows = lines
    .slice(1)
    .map((line) => {
      const values: string[] = []
      let inQuote = false
      let current = ''
      for (const char of line) {
        if (char === '"') inQuote = !inQuote
        else if (char === ',' && !inQuote) {
          values.push(current.trim())
          current = ''
        } else current += char
      }
      values.push(current.trim())
      return Object.fromEntries(headers.map((h, i) => [h, (values[i] || '').replace(/^"|"$/g, '')]))
    })
    .filter((row) => Object.values(row).some((v) => v.trim()))
  return { headers, rows }
}

function normalizeDate(rawDate: string) {
  if (!rawDate) return ''
  if (rawDate.includes('/')) {
    const parts = rawDate.split('/')
    if (parts[0]?.length === 4) return rawDate.replace(/\//g, '-')
    return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
  }
  if (rawDate.includes('-')) {
    const parts = rawDate.split('-')
    if (parts[0]?.length === 4) return rawDate
    return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
  }
  return rawDate
}

function parseSignedAmount(row: Record<string, string>, columnMap: any) {
  if (columnMap.debit || columnMap.credit) {
    const debit = parseFloat(String(row[columnMap.debit] || '0').replace(/[$,()]/g, '')) || 0
    const credit = parseFloat(String(row[columnMap.credit] || '0').replace(/[$,()]/g, '')) || 0
    if (debit) return debit
    if (credit) return -credit
  }
  const raw = String(row[columnMap.amount] || '0')
  const isNegative = raw.includes('(') || raw.trim().startsWith('-')
  const amount = parseFloat(raw.replace(/[$,()+-]/g, ''))
  if (Number.isNaN(amount)) return null
  return isNegative ? -amount : amount
}

export function ImportContent({ accounts, userId }: { accounts: any[]; userId: string }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [dragActive, setDragActive] = useState(false)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [selectedRows, setSelectedRows] = useState<Record<number, boolean>>({})
  const [bankPreset, setBankPreset] = useState<keyof typeof BANK_PRESETS>('custom')
  const [columnMap, setColumnMap] = useState<any>({ date: '', description: '', amount: '', category: '', debit: '', credit: '' })
  const [accountId, setAccountId] = useState(accounts[0]?.id || '')
  const [manualAccount, setManualAccount] = useState({ name: '', type: 'depository' })

  async function handleFile(file: File) {
    const text = await file.text()
    const parsed = parseCSV(text)
    setHeaders(parsed.headers)
    setRows(parsed.rows)
    const autoMap: any = { date: '', description: '', amount: '', category: '', debit: '', credit: '' }
    parsed.headers.forEach((header) => {
      const lower = header.toLowerCase()
      if (!autoMap.date && lower.includes('date')) autoMap.date = header
      if (!autoMap.description && ['description', 'memo', 'payee', 'merchant', 'transaction description'].some((token) => lower.includes(token))) autoMap.description = header
      if (!autoMap.amount && lower.includes('amount')) autoMap.amount = header
      if (!autoMap.debit && lower.includes('debit')) autoMap.debit = header
      if (!autoMap.credit && lower.includes('credit')) autoMap.credit = header
      if (!autoMap.category && lower.includes('category')) autoMap.category = header
    })
    if (autoMap.debit && autoMap.credit) autoMap.amount = ''
    setColumnMap(autoMap)
    setSelectedRows(Object.fromEntries(parsed.rows.map((_, index) => [index, true])))
    setStep(2)
  }

  async function createManualAccount() {
    const { data, error } = await supabase
      .from('accounts')
      .insert({ user_id: userId, name: manualAccount.name, type: manualAccount.type === 'credit' ? 'credit' : manualAccount.type === 'loan' ? 'loan' : manualAccount.type === 'investment' ? 'investment' : 'depository', plaid_account_id: null, current_balance: 0 })
      .select('id, name, type, institution_name')
      .single()
    if (error) {
      toast.error(error.message)
      return
    }
    accounts.push(data)
    setAccountId(data.id)
    toast.success('Manual account created')
  }

  const previewRows = rows.slice(0, 5)
  const mappedPreview = rows
    .map((row, index) => ({ index, row, amount: parseSignedAmount(row, columnMap), date: normalizeDate(String(row[columnMap.date] || '')), description: row[columnMap.description] || '', category: columnMap.category ? row[columnMap.category] || 'Other' : 'Other' }))
    .filter((item) => item.amount !== null && item.date && item.description)
  const selectedPreview = mappedPreview.filter((item) => selectedRows[item.index] !== false)
  const earliest = selectedPreview.map((item) => item.date).sort()[0]
  const latest = [...selectedPreview.map((item) => item.date)].sort().at(-1)
  const duplicateCount = new Set(selectedPreview.map((item) => `${item.date}_${item.description}_${item.amount}`)).size !== selectedPreview.length ? selectedPreview.length - new Set(selectedPreview.map((item) => `${item.date}_${item.description}_${item.amount}`)).size : 0

  async function importRows() {
    const payloadRows = selectedPreview.map((item) => item.row)
    const response = await fetch('/api/import/csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: payloadRows, account_id: accountId || null, column_map: columnMap }),
    })
    const data = await response.json()
    if (!response.ok) {
      toast.error(data.error || 'Import failed')
      return
    }
    toast.success(`Imported ${data.imported} transactions`)
    setStep(4)
    router.refresh()
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3, 4].map((item, index) => (
          <div key={item} className="flex items-center gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm ${step >= item ? 'border-teal bg-teal-bg text-teal' : 'border-border text-muted'}`}>{item}</div>
            {index < 3 && <div className={`h-px w-12 ${step > item ? 'bg-teal' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <section className="rounded-2xl bg-surface border border-border p-6">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragActive(false)
              const file = e.dataTransfer.files[0]
              if (file) void handleFile(file)
            }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${dragActive ? 'border-teal bg-teal-bg' : 'border-border hover:border-teal/40'}`}
          >
            <Upload size={28} className="mx-auto text-teal" />
            <div className="mt-4 font-display text-2xl font-bold text-primary">Drop your bank statement CSV here</div>
            <p className="mt-2 text-sm text-secondary">Or click to browse. CSV files only.</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && void handleFile(e.target.files[0])} />
          </div>
          {previewRows.length > 0 && (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-panel/60 text-left text-muted"><tr>{headers.map((header) => <th key={header} className="px-4 py-3">{header}</th>)}</tr></thead>
                <tbody>{previewRows.map((row, index) => <tr key={index} className="border-t border-border">{headers.map((header) => <td key={header} className="px-4 py-3 text-primary">{row[header]}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {step === 2 && (
        <section className="rounded-2xl bg-surface border border-border p-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <select value={bankPreset} onChange={(e) => {
              const preset = e.target.value as keyof typeof BANK_PRESETS
              setBankPreset(preset)
              const values = BANK_PRESETS[preset]
              setColumnMap((current: any) => ({ ...current, date: values.date || current.date, description: values.description || current.description, amount: values.amount || current.amount }))
            }} className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all">
              {Object.keys(BANK_PRESETS).map((key) => <option key={key} value={key}>{key.replace(/_/g, ' ')}</option>)}
            </select>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all">
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.institution_name ? `${account.institution_name} • ` : ''}{account.name}</option>)}
              <option value="manual_new">Create manual account</option>
            </select>
          </div>
          {accountId === 'manual_new' && (
            <div className="grid gap-3 md:grid-cols-[1fr,180px,160px]">
              <input value={manualAccount.name} onChange={(e) => setManualAccount((current) => ({ ...current, name: e.target.value }))} placeholder="Account name" className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm placeholder:text-muted focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all" />
              <select value={manualAccount.type} onChange={(e) => setManualAccount((current) => ({ ...current, type: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all">
                <option value="depository">Checking</option>
                <option value="depository">Savings</option>
                <option value="credit">Credit Card</option>
              </select>
              <button onClick={createManualAccount} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal text-canvas font-semibold text-sm hover:bg-teal/90 transition-all">Save Account</button>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-4">
            {['date', 'description', 'amount', 'category'].map((key) => (
              <select key={key} value={columnMap[key] || ''} onChange={(e) => setColumnMap((current: any) => ({ ...current, [key]: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all">
                <option value="">{key}</option>
                {headers.map((header) => <option key={header} value={header}>{header}</option>)}
              </select>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <select value={columnMap.debit || ''} onChange={(e) => setColumnMap((current: any) => ({ ...current, debit: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all">
              <option value="">Debit column (optional)</option>
              {headers.map((header) => <option key={header} value={header}>{header}</option>)}
            </select>
            <select value={columnMap.credit || ''} onChange={(e) => setColumnMap((current: any) => ({ ...current, credit: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-panel border border-border text-primary text-sm focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/30 transition-all">
              <option value="">Credit column (optional)</option>
              {headers.map((header) => <option key={header} value={header}>{header}</option>)}
            </select>
          </div>
          <div className="rounded-2xl border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-panel/60 text-left text-muted"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Amount</th></tr></thead>
              <tbody>{mappedPreview.slice(0, 3).map((item) => <tr key={item.index} className="border-t border-border"><td className="px-4 py-3 text-primary">{item.date}</td><td className="px-4 py-3 text-primary">{item.description}</td><td className="px-4 py-3 text-primary">{item.amount}</td></tr>)}</tbody>
            </table>
          </div>
          <button onClick={() => setStep(3)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal text-canvas font-semibold text-sm hover:bg-teal/90 transition-all">Continue</button>
        </section>
      )}

      {step === 3 && (
        <section className="rounded-2xl bg-surface border border-border p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-primary font-semibold">{selectedPreview.length} transactions ready to import</div>
              <div className="text-sm text-secondary">From {earliest ? formatDate(earliest) : 'N/A'} to {latest ? formatDate(latest) : 'N/A'}</div>
            </div>
            {duplicateCount > 0 && <div className="text-sm text-warn">{duplicateCount} transactions may already exist</div>}
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border max-h-[420px]">
            <table className="w-full text-sm">
              <thead className="bg-panel/60 text-left text-muted"><tr><th className="px-4 py-3"></th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Category</th></tr></thead>
              <tbody>{mappedPreview.map((item) => <tr key={item.index} className="border-t border-border"><td className="px-4 py-3"><input type="checkbox" checked={selectedRows[item.index] !== false} onChange={(e) => setSelectedRows((current) => ({ ...current, [item.index]: e.target.checked }))} /></td><td className="px-4 py-3 text-primary">{item.date}</td><td className="px-4 py-3 text-primary">{item.description}</td><td className="px-4 py-3 text-primary">{item.amount}</td><td className="px-4 py-3 text-primary">{item.category}</td></tr>)}</tbody>
            </table>
          </div>
          <button onClick={importRows} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal text-canvas font-semibold text-sm hover:bg-teal/90 transition-all">Import {selectedPreview.length} Transactions</button>
        </section>
      )}

      {step === 4 && (
        <section className="rounded-2xl bg-surface border border-border p-6 text-center space-y-4">
          <div className="text-3xl">✅</div>
          <div className="font-display text-2xl font-bold text-primary">Imported {selectedPreview.length} transactions successfully</div>
          <div className="flex justify-center gap-3">
            <button onClick={() => router.push('/transactions')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal text-canvas font-semibold text-sm hover:bg-teal/90 transition-all">View Transactions</button>
            <button onClick={() => { setStep(1); setRows([]); setHeaders([]) }} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-secondary text-sm hover:text-primary hover:border-teal/30 transition-all">Import Another File</button>
          </div>
        </section>
      )}
    </div>
  )
}
