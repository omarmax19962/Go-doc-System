'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle, XCircle, User, Mail, Phone, FileText, Copy, RotateCcw } from 'lucide-react'
import { acceptApplicationAction, rejectApplicationAction } from '@/app/actions/doctor'
import { formatDistanceToNow } from 'date-fns'

type Application = {
  id: string
  full_name: string
  email: string
  phone: string | null
  specialty: string
  gender: string
  bio: string | null
  status: 'pending' | 'accepted' | 'rejected'
  rejection_reason: string | null
  cv_url: string | null
  created_at: string
}

const STATUS_TABS = ['pending', 'accepted', 'rejected'] as const

export default function ApplicationsClient({ applications: initial }: { applications: Application[] }) {
  const router = useRouter()
  const [applications, setApplications] = useState(initial)
  const [tab, setTab] = useState<typeof STATUS_TABS[number]>('pending')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password?: string; reactivated?: boolean } | null>(null)

  const filtered = applications.filter(a => a.status === tab)
  const pendingCount = applications.filter(a => a.status === 'pending').length

  function updateLocalStatus(id: string, status: Application['status'], rejection_reason?: string | null) {
    setApplications(prev => prev.map(a =>
      a.id === id ? { ...a, status, rejection_reason: rejection_reason ?? a.rejection_reason } : a
    ))
  }

  async function handleAccept(app: Application) {
    setLoadingId(app.id)
    const result = await acceptApplicationAction(app.id)
    setLoadingId(null)

    if (result.error) {
      toast.error(result.error)
      return
    }

    updateLocalStatus(app.id, 'accepted')

    if ((result as any).reactivated) {
      toast.success('Doctor account re-activated')
      router.refresh()
      return
    }

    setCreatedCreds({ email: (result as any).email, password: (result as any).tempPassword })
    toast.success('Application accepted — account created')
  }

  async function handleReject(id: string) {
    setLoadingId(id)
    const result = await rejectApplicationAction(id, rejectReason || undefined)
    setLoadingId(null)

    if (result.error) {
      toast.error(result.error)
      return
    }

    updateLocalStatus(id, 'rejected', rejectReason || null)
    setRejectingId(null)
    setRejectReason('')
    toast.success('Application rejected')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Doctor Applications</h1>
        <p className="text-sm text-muted mt-0.5">{pendingCount} pending review</p>
      </div>

      {/* Credentials modal */}
      {createdCreds && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success-bg mb-4 mx-auto">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center mb-1">Account Created</h2>
            <p className="text-sm text-muted text-center mb-5">Share these credentials with the doctor</p>

            <div className="space-y-3 bg-muted-bg rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Email</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-medium">{createdCreds.email}</span>
                  <button onClick={() => { navigator.clipboard.writeText(createdCreds.email); toast.success('Copied') }}
                    className="text-muted hover:text-gray-700">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {createdCreds.password && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Temp Password</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-medium">{createdCreds.password}</span>
                    <button onClick={() => { navigator.clipboard.writeText(createdCreds.password!); toast.success('Copied') }}
                      className="text-muted hover:text-gray-700">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-muted text-center mb-4">
              The doctor should change their password after first login.
            </p>
            <button onClick={() => setCreatedCreds(null)}
              className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-muted-bg rounded-lg p-1 mb-5 w-fit">
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition capitalize ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-muted hover:text-gray-700'
            }`}>
            {t}
            {t === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-xs font-bold rounded-full bg-danger text-white">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Applications list */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-border text-muted">
            No {tab} applications
          </div>
        )}

        {filtered.map(app => (
          <div key={app.id} className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{app.full_name.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{app.full_name}</p>
                  <p className="text-xs text-muted capitalize">{app.specialty} · {app.gender}</p>
                </div>
              </div>
              <span className="text-xs text-muted shrink-0">
                {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{app.email}</span>
              {app.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{app.phone}</span>}
              {app.cv_url && (
                <a
                  href={app.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-primary hover:underline font-medium"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View CV
                </a>
              )}
            </div>

            {app.bio && (
              <p className="mt-3 text-sm text-gray-600 bg-muted-bg rounded-lg px-3 py-2 leading-relaxed">
                {app.bio}
              </p>
            )}

            {app.status === 'rejected' && app.rejection_reason && (
              <p className="mt-3 text-xs text-danger bg-danger-bg rounded-lg px-3 py-2">
                Rejection reason: {app.rejection_reason}
              </p>
            )}

            {/* Actions */}
            {(app.status === 'pending' || app.status === 'rejected') && (
              <div className="mt-4 flex gap-2">
                {rejectingId === app.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-danger"
                      placeholder="Rejection reason (optional)"
                      autoFocus
                    />
                    <button onClick={() => handleReject(app.id)} disabled={loadingId === app.id}
                      className="px-4 py-2 bg-danger text-white text-sm font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-60">
                      {loadingId === app.id ? '...' : 'Confirm'}
                    </button>
                    <button onClick={() => { setRejectingId(null); setRejectReason('') }}
                      className="px-3 py-2 border border-border rounded-lg text-sm text-gray-600 hover:bg-muted-bg transition">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => handleAccept(app)} disabled={loadingId === app.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-success text-white text-sm font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-60">
                      {app.status === 'rejected'
                        ? <><RotateCcw className="w-4 h-4" />{loadingId === app.id ? '...' : 'Accept anyway'}</>
                        : <><CheckCircle className="w-4 h-4" />{loadingId === app.id ? 'Creating account...' : 'Accept'}</>
                      }
                    </button>
                    {app.status === 'pending' && (
                      <button onClick={() => setRejectingId(app.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-danger text-danger text-sm font-medium rounded-lg hover:bg-danger-bg transition">
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
