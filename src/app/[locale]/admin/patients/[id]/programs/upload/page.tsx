'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { useRouter, useParams } from 'next/navigation'
import { Upload, File, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function UploadProgramPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string
  const locale = params.locale as string

  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [drag, setDrag] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `programs/${patientId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('program-docs')
      .upload(path, file)

    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('program-docs')
      .getPublicUrl(path)

    // Get current doctor
    const { data: { user } } = await supabase.auth.getUser()
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user!.id)
      .maybeSingle()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user!.id)
      .single()

    let doctorId = doctor?.id
    if (!doctorId) {
      const { data: pd } = await supabase
        .from('patients')
        .select('assigned_doctor_id')
        .eq('id', patientId)
        .single()
      doctorId = pd?.assigned_doctor_id
    }

    const { error: dbError } = await supabase.from('programs').insert({
      patient_id: patientId,
      doctor_id: doctorId ?? '',
      source: 'uploaded',
      uploaded_file_url: publicUrl,
      uploaded_file_name: file.name,
      is_active: true,
    })

    if (dbError) { toast.error('Failed to save program record'); setUploading(false); return }

    toast.success('Document uploaded successfully')
    router.push(`/${locale}/admin/patients/${patientId}`)
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Link
        href={`/${locale}/admin/patients/${patientId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-gray-700 mb-4 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to patient
      </Link>

      <h1 className="text-xl font-bold text-gray-900 mb-5">Upload Program Document</h1>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition ${
          drag ? 'border-primary bg-primary-light' : 'border-border hover:border-primary'
        }`}
      >
        <Upload className="w-8 h-8 text-muted mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-700">Drop your file here</p>
        <p className="text-xs text-muted mt-1">Word (.docx) or PDF</p>
        <label className="mt-4 inline-block cursor-pointer">
          <span className="text-xs font-semibold text-primary hover:text-primary-dark">
            Browse files
          </span>
          <input
            type="file"
            accept=".docx,.pdf,.doc"
            className="hidden"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {file && (
        <div className="mt-4 flex items-center gap-3 p-3.5 bg-primary-light rounded-xl border border-primary/20">
          <File className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
            <p className="text-xs text-muted">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button onClick={() => setFile(null)} className="text-muted hover:text-danger text-xs">✕</button>
        </div>
      )}

      <div className="flex gap-3 mt-5">
        <button
          onClick={() => router.back()}
          className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-gray-700 hover:bg-muted-bg transition"
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </div>

      <p className="text-xs text-muted mt-4 text-center">
        The document will be stored as-is and viewable inside the patient file.
        Use &ldquo;Create from Form&rdquo; if you want a structured program you can edit.
      </p>
    </div>
  )
}
