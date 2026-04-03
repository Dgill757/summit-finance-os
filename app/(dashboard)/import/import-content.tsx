'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ArrowRight, Check, Upload } from 'lucide-react'
import { cleanMerchantName, detectCategoryFromDescription } from '@/lib/utils/merchant-cleaner'
import { getCategoryInfo } from '@/lib/utils/categories'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'

interface Account {
  id: string
  name: string
  type: string
  institution_name: string | null
}

interface ParsedRow {
  date: string
  description: string
  cleanName: string
  amount: number
  category: string
  isIncome: boolean
  selected: boolean
}

function parseBoACSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  let headerIdx = -1

  for (let i = 0; i < Math.min(lines.length, 15); i += 1) {
    const lower = lines[i].toLowerCase()
    if (lower.includes('date') && lower.includes('description') && lower.includes('amount')) {
      headerIdx = i
      break
    }
  }

  if (headerIdx === -1) {
    headerIdx = lines.findIndex((line) => /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(line)) - 1
    if (headerIdx < 0) headerIdx = 0
  }

  const parseCSVLine = (line: string) => {
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
    return values.map((value) => value.replace(/^"|"$/g, '').trim())
  }

  const headers = parseCSVLine(lines[headerIdx])
  const rows: Record<string, string>[] = []

  for (let i = headerIdx + 1; i < lines.length; i += 1) {
    const line = lines[i].trim()
    if (!line) continue
    if (!/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(line.replace(/^"/, ''))) continue
    const values = parseCSVLine(line)
    if (values.length < 2) continue
    const row: Record<string, string> = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx] || ''
    })
    rows.push(row)
  }

  return { headers, rows }
}

function convertDate(raw: string): string {
  const parts = raw.replace(/"/g, '').trim().split('/')
  if (parts.length === 3) {
    const [month, day, yearRaw] = parts
    const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  return raw
}

export function ImportContent({ accounts }: { accounts: Account[] }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || 'create')
  const [newAccountName, setNewAccountName] = useState('Bank of America Checking')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number } | null>(null)
  const [filterCategory, setFilterCategory] = useState('All')

  const processFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = String(event.target?.result || '')
      const { headers, rows } = parseBoACSV(text)

      const findCol = (options: string[]) => headers.find((header) => options.some((option) => header.toLowerCase().includes(option.toLowerCase()))) || headers[0]
      const dateCol = findCol(['date', 'trans date', 'transaction date', 'posted date'])
      const descCol = findCol(['description', 'memo', 'payee', 'merchant', 'narrative'])
      const amtCol = findCol(['amount', 'debit', 'transaction amount'])

      const processed = rows
        .filter((row) => row[dateCol] && row[descCol])
        .map((row) => {
          const rawAmount = (row[amtCol] || '0').replace(/[$,"]/g, '').trim()
          const amount = parseFloat(rawAmount) || 0
          const description = row[descCol] || ''
          const isIncome = amount > 0

          return {
            date: convertDate(row[dateCol]),
            description,
            cleanName: cleanMerchantName(description),
            amount: isIncome ? -Math.abs(amount) : Math.abs(amount),
            category: detectCategoryFromDescription(description),
            isIncome,
            selected: true,
          }
        })
        .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date))

      setParsedRows(processed)
      setStep(2)
    }
    reader.readAsText(file)
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragging(false)
      const file = event.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  const toggleRow = (idx: number) => {
    setParsedRows((current) => current.map((row, rowIdx) => (rowIdx === idx ? { ...row, selected: !row.selected } : row)))
  }

  const updateCategory = (idx: number, category: string) => {
    setParsedRows((current) => current.map((row, rowIdx) => (rowIdx === idx ? { ...row, category } : row)))
  }

  const handleImport = async () => {
    setImporting(true)
    try {
      const supabase = createClient()
      let accountId = selectedAccountId

      if (accountId === 'create') {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()
        if (userError || !user) throw new Error('Unable to resolve your account')

        const { data: newAccount, error } = await supabase
          .from('accounts')
          .insert({
            user_id: user.id,
            name: newAccountName,
            type: 'depository',
            institution_name: 'Manual Import',
            current_balance: 0,
            currency_code: 'USD',
            is_hidden: false,
          })
          .select('id')
          .single()

        if (error) throw error
        accountId = newAccount.id
      }

      const selectedRows = parsedRows.filter((row) => row.selected)
      const response = await fetch('/api/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: selectedRows.map((row) => ({
            date: row.date,
            description: row.cleanName,
            original_description: row.description,
            amount: row.amount,
            category: row.category,
          })),
          account_id: accountId,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Import failed')

      setImportResult({ imported: data.imported })
      setStep(4)
      toast.success(`Imported ${data.imported} transactions`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const selectedCount = parsedRows.filter((row) => row.selected).length
  const incomeCount = parsedRows.filter((row) => row.isIncome && row.selected).length
  const expenseCount = selectedCount - incomeCount
  const totalSpend = parsedRows.filter((row) => !row.isIncome && row.selected).reduce((sum, row) => sum + Math.abs(row.amount), 0)
  const totalIncome = parsedRows.filter((row) => row.isIncome && row.selected).reduce((sum, row) => sum + Math.abs(row.amount), 0)
  const categories = useMemo(() => ['All', ...Array.from(new Set(parsedRows.map((row) => row.category))).sort()], [parsedRows])
  const displayRows = filterCategory === 'All' ? parsedRows : parsedRows.filter((row) => row.category === filterCategory)

  return (
    <div className="max-w-5xl space-y-5 p-6">
      <div className="mb-6 flex items-center justify-center gap-0">
        {['Upload', 'Review', 'Import', 'Done'].map((label, i) => {
          const num = i + 1
          const active = step === num
          const done = step > num

          return (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all',
                    done ? 'border-teal bg-teal text-canvas' : active ? 'border-teal text-teal' : 'border-border text-muted',
                  )}
                >
                  {done ? <Check size={14} /> : num}
                </div>
                <span className={cn('mt-1 font-mono text-[10px]', active || done ? 'text-teal' : 'text-muted')}>{label}</span>
              </div>
              {i < 3 ? <div className={cn('mx-1 mb-5 h-px w-16', done ? 'bg-teal' : 'bg-border')} /> : null}
            </div>
          )
        })}
      </div>

      {step === 1 ? (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-1 font-display text-lg font-bold text-primary">Upload Bank Statement</h2>
          <p className="mb-6 text-sm text-muted">Works with Bank of America, Chase, Wells Fargo, Capital One, USAA, and any CSV export.</p>

          <div
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('csv-input')?.click()}
            className={cn(
              'cursor-pointer rounded-2xl border-2 border-dashed p-16 text-center transition-all',
              isDragging ? 'border-teal bg-teal-bg' : 'border-border hover:border-teal/40 hover:bg-panel/50',
            )}
          >
            <Upload size={32} className={cn('mx-auto mb-4', isDragging ? 'text-teal' : 'text-muted')} />
            <p className="mb-1 font-semibold text-primary">Drop your CSV file here</p>
            <p className="text-sm text-muted">or click to browse your files</p>
            <p className="mt-3 font-mono text-xs text-muted">Supports .csv files from any bank</p>
          </div>
          <input
            id="csv-input"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) processFile(file)
            }}
          />

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              { bank: 'Bank of America', steps: 'Accounts -> Transactions -> Download -> CSV' },
              { bank: 'Chase', steps: 'Accounts -> Download -> CSV -> Select dates' },
              { bank: 'Any Bank', steps: 'Look for Download, Export, or Statements' },
            ].map((item) => (
              <div key={item.bank} className="rounded-xl border border-border bg-panel p-3">
                <p className="mb-1 text-xs font-semibold text-primary">{item.bank}</p>
                <p className="text-[10px] leading-relaxed text-muted">{item.steps}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            {[
              { label: 'Transactions', value: `${selectedCount}`, color: 'text-primary' },
              { label: 'Total Spending', value: formatCurrency(totalSpend), color: 'text-down' },
              { label: 'Total Income', value: formatCurrency(totalIncome), color: 'text-up' },
              { label: 'File', value: fileName.slice(0, 20), color: 'text-teal' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-surface p-4">
                <p className="mb-1 font-mono text-xs uppercase tracking-wider text-muted">{item.label}</p>
                <p className={cn('font-num text-lg font-bold', item.color)}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="mb-3 font-display font-bold text-primary">Assign to Account</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-muted">Account</label>
                <select
                  value={selectedAccountId}
                  onChange={(event) => setSelectedAccountId(event.target.value)}
                  className="w-full rounded-xl border border-border bg-panel px-3 py-2.5 text-sm text-primary focus:border-teal/40 focus:outline-none"
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} {account.institution_name ? `- ${account.institution_name}` : ''}
                    </option>
                  ))}
                  <option value="create">+ Create new account</option>
                </select>
              </div>
              {selectedAccountId === 'create' ? (
                <div>
                  <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-muted">Account Name</label>
                  <input
                    value={newAccountName}
                    onChange={(event) => setNewAccountName(event.target.value)}
                    className="w-full rounded-xl border border-border bg-panel px-3 py-2.5 text-sm text-primary focus:border-teal/40 focus:outline-none"
                    placeholder="Bank of America Checking"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={cn(
                  'rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all',
                  filterCategory === category ? 'border-teal/30 bg-teal-bg text-teal' : 'border-border bg-surface text-muted hover:text-primary',
                )}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="grid grid-cols-12 border-b border-border bg-panel px-4 py-3">
              <div className="col-span-1 font-mono text-[10px] uppercase tracking-wider text-muted">Select</div>
              <div className="col-span-2 font-mono text-[10px] uppercase tracking-wider text-muted">Date</div>
              <div className="col-span-4 font-mono text-[10px] uppercase tracking-wider text-muted">Merchant</div>
              <div className="col-span-3 font-mono text-[10px] uppercase tracking-wider text-muted">Category</div>
              <div className="col-span-2 text-right font-mono text-[10px] uppercase tracking-wider text-muted">Amount</div>
            </div>
            <div className="max-h-96 divide-y divide-border overflow-y-auto">
              {displayRows.map((row, idx) => {
                const info = getCategoryInfo(row.category)
                const realIdx = parsedRows.indexOf(row)
                return (
                  <div key={`${row.date}-${row.description}-${idx}`} className={cn('grid grid-cols-12 items-center px-4 py-2.5', !row.selected && 'opacity-40')}>
                    <div className="col-span-1">
                      <button
                        onClick={() => toggleRow(realIdx)}
                        className={cn('flex h-5 w-5 items-center justify-center rounded border transition-all', row.selected ? 'border-teal bg-teal' : 'border-border')}
                      >
                        {row.selected ? <Check size={10} className="text-canvas" /> : null}
                      </button>
                    </div>
                    <div className="col-span-2 font-mono text-xs text-muted">{formatDate(row.date, 'MMM d')}</div>
                    <div className="col-span-4 min-w-0 pr-2">
                      <p className="truncate text-xs font-semibold text-primary">{row.cleanName}</p>
                      <p className="truncate text-[10px] text-muted">{row.description.slice(0, 40)}</p>
                    </div>
                    <div className="col-span-3">
                      <select
                        value={row.category}
                        onChange={(event) => updateCategory(realIdx, event.target.value)}
                        className="w-full truncate rounded-lg border px-2 py-1 text-[10px] focus:border-teal/40 focus:outline-none"
                        style={{ backgroundColor: info.bgColor, borderColor: `${info.color}40`, color: info.color }}
                      >
                        {['Food & Dining', 'Groceries', 'Transportation', 'Shopping', 'Housing', 'Entertainment', 'Health', 'Travel', 'Subscriptions', 'Business', 'Utilities', 'Income', 'Transfer', 'Other'].map((category) => (
                          <option key={category} value={category} style={{ background: '#0e1520', color: '#e8edf5' }}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className={cn('font-num text-sm font-bold', row.isIncome ? 'text-up' : 'text-primary')}>
                        {row.isIncome ? '+' : '-'}
                        {formatCurrency(Math.abs(row.amount))}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="mb-1 font-mono text-xs uppercase tracking-wider text-muted">Selected Expenses</p>
              <p className="font-num text-lg font-bold text-primary">{expenseCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="mb-1 font-mono text-xs uppercase tracking-wider text-muted">Selected Income</p>
              <p className="font-num text-lg font-bold text-up">{incomeCount}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setStep(1)} className="rounded-xl border border-border px-4 py-2 text-sm text-secondary transition-all hover:text-primary">
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={selectedCount === 0}
              className="flex items-center gap-2 rounded-xl bg-teal px-6 py-2.5 text-sm font-semibold text-canvas transition-all hover:bg-teal/90 disabled:opacity-50"
            >
              Review {selectedCount} transactions <ArrowRight size={14} />
            </button>
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <div className="space-y-5 rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-bold text-primary">Ready to Import</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { label: 'Transactions', value: `${selectedCount}`, color: 'text-primary' },
              { label: 'Total Spending', value: formatCurrency(totalSpend), color: 'text-down' },
              { label: 'Total Income', value: formatCurrency(totalIncome), color: 'text-up' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-panel p-4 text-center">
                <p className="mb-1 font-mono text-xs uppercase tracking-wider text-muted">{item.label}</p>
                <p className={cn('font-num text-xl font-bold', item.color)}>{item.value}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted">By Category</p>
            <div className="space-y-2">
              {Object.entries(
                parsedRows
                  .filter((row) => row.selected && !row.isIncome)
                  .reduce<Record<string, number>>((acc, row) => {
                    acc[row.category] = (acc[row.category] || 0) + Math.abs(row.amount)
                    return acc
                  }, {}),
              )
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([category, amount]) => {
                  const info = getCategoryInfo(category)
                  const pct = totalSpend > 0 ? (amount / totalSpend) * 100 : 0
                  return (
                    <div key={category} className="flex items-center gap-3">
                      <span className="w-5 text-sm">{info.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex justify-between">
                          <span className="text-xs font-semibold text-primary">{category}</span>
                          <span className="font-mono text-xs text-muted">{formatCurrency(amount)}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-border">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: info.color }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          <div className="rounded-xl border border-teal/20 bg-teal-bg p-4">
            <p className="text-xs font-semibold text-teal">
              After import, transactions populate your dashboard, budgets track automatically, the AI Advisor can analyze your spending, and subscriptions are auto-detected.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setStep(2)} className="rounded-xl border border-border px-4 py-2 text-sm text-secondary transition-all hover:text-primary">
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 rounded-xl bg-teal px-8 py-3 text-sm font-bold text-canvas transition-all hover:bg-teal/90 disabled:opacity-50"
            >
              {importing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-canvas/30 border-t-canvas" />
                  Importing...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Import {selectedCount} Transactions
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}

      {step === 4 && importResult ? (
        <div className="rounded-2xl border border-teal/20 bg-surface p-12 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-teal/30 bg-teal-bg">
            <Check size={28} className="text-teal" />
          </div>
          <h2 className="mb-2 font-display text-2xl font-bold text-primary">{importResult.imported} Transactions Imported</h2>
          <p className="mb-8 text-secondary">Your dashboard, budgets, reports, and AI Advisor now have access to your real financial data.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 rounded-xl bg-teal px-6 py-3 font-semibold text-canvas transition-all hover:bg-teal/90"
            >
              View Dashboard <ArrowRight size={15} />
            </button>
            <button onClick={() => router.push('/transactions')} className="rounded-xl border border-border px-6 py-3 text-secondary transition-all hover:text-primary">
              View Transactions
            </button>
            <button
              onClick={() => {
                setStep(1)
                setParsedRows([])
                setFileName('')
                setImportResult(null)
              }}
              className="rounded-xl border border-border px-6 py-3 text-secondary transition-all hover:text-primary"
            >
              Import Another File
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
