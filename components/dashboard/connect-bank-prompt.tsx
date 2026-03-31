import { Link2, Shield, Zap } from 'lucide-react'
import { PlaidConnectButton } from '@/components/shared/plaid-connect-button'

export function ConnectBankPrompt({ onSuccess }: { onSuccess?: () => void }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="max-w-xl rounded-[28px] border border-border bg-surface p-10 text-center shadow-elevated">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-bg text-teal shadow-glow-teal">
          <Link2 size={24} />
        </div>
        <h2 className="font-display text-3xl font-bold text-primary">Connect Your Bank</h2>
        <p className="mt-3 text-sm leading-6 text-secondary">Bring your live financial picture into Summit Finance OS. Once connected, your dashboard, budgets, and AI advisor start working with real data.</p>
        <div className="mt-6 flex justify-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-panel px-3 py-2 text-xs text-secondary"><Shield size={14} className="text-teal" /> Bank-grade security</div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-panel px-3 py-2 text-xs text-secondary"><Zap size={14} className="text-teal" /> Instant sync</div>
        </div>
        <div className="mt-8 flex justify-center">
          <PlaidConnectButton onSuccess={onSuccess} />
        </div>
      </div>
    </div>
  )
}
