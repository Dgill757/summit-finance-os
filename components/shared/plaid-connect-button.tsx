'use client'

import { useCallback, useEffect, useState } from 'react'
import { Link2 } from 'lucide-react'
import { usePlaidLink } from 'react-plaid-link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

export function PlaidConnectButton({ onSuccess, variant = 'primary' }: { onSuccess?: () => void; variant?: 'primary' | 'ghost' }) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [institution, setInstitution] = useState<{ name?: string; institution_id?: string | null } | null>(null)

  const fetchToken = useCallback(async () => {
    try {
      const res = await fetch('/api/plaid/create-link-token', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to create link token')
      setLinkToken(data.link_token)
    } catch (error: any) {
      toast.error(error.message || 'Failed to initialize Plaid')
    }
  }, [])

  useEffect(() => {
    fetchToken()
  }, [fetchToken])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      setInstitution({ name: metadata.institution?.name, institution_id: metadata.institution?.institution_id })
      try {
        const res = await fetch('/api/plaid/exchange-public-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            public_token,
            institution_name: metadata.institution?.name || institution?.name,
            institution_id: metadata.institution?.institution_id || institution?.institution_id,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to connect account')
        toast.success(`Connected ${data.account_count} account${data.account_count === 1 ? '' : 's'}`)
        setLinkToken(null)
        await fetchToken()
        onSuccess?.()
      } catch (error: any) {
        toast.error(error.message || 'Failed to connect bank')
      }
    },
  })

  return (
    <button
      onClick={() => open()}
      disabled={!ready || !linkToken}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary'
          ? 'border-teal/20 bg-teal text-canvas hover:bg-teal/90'
          : 'border-border bg-panel text-primary hover:border-teal/30 hover:text-teal',
      )}
    >
      <Link2 size={15} />
      <span>{ready ? 'Add Account' : 'Preparing Plaid...'}</span>
    </button>
  )
}
