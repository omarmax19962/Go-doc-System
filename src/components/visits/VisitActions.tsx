'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Play, CheckCircle, XCircle } from 'lucide-react'
import type { VisitStatus } from '@/types'

export default function VisitActions({
  visitId,
  visitStatus,
  isOwnVisit,
}: {
  visitId: string
  visitStatus: VisitStatus
  isOwnVisit: boolean
}) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function updateStatus(status: VisitStatus) {
    setLoading(true)
    const updates: any = { status }
    if (status === 'in_progress') updates.started_at = new Date().toISOString()
    if (status === 'completed') updates.completed_at = new Date().toISOString()

    const { error } = await supabase
      .from('visits')
      .update(updates)
      .eq('id', visitId)

    if (error) {
      toast.error('Failed to update visit')
      setLoading(false)
      return
    }

    toast.success(
      status === 'in_progress' ? 'Visit started' :
      status === 'completed' ? 'Visit completed' : 'Visit cancelled'
    )
    router.refresh()
    setLoading(false)
  }

  if (!isOwnVisit) return null

  return (
    <div className="flex items-center gap-2">
      {visitStatus === 'scheduled' || visitStatus === 'confirmed' ? (
        <button
          onClick={() => updateStatus('in_progress')}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark transition disabled:opacity-60"
        >
          <Play className="w-3.5 h-3.5" />
          Start Visit
        </button>
      ) : visitStatus === 'in_progress' ? (
        <button
          onClick={() => updateStatus('completed')}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success text-white text-xs font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-60"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Complete Visit
        </button>
      ) : null}

      {(visitStatus === 'scheduled' || visitStatus === 'confirmed') && (
        <button
          onClick={() => updateStatus('cancelled')}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-danger text-danger text-xs font-semibold rounded-lg hover:bg-danger-bg transition disabled:opacity-60"
        >
          <XCircle className="w-3.5 h-3.5" />
          Cancel
        </button>
      )}
    </div>
  )
}
