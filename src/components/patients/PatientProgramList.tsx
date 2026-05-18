import Link from 'next/link'
import { format } from 'date-fns'
import { FileText, Upload, PlusCircle } from 'lucide-react'

export default function PatientProgramList({
  programs,
  patientId,
  locale,
}: {
  programs: any[]
  patientId: string
  locale: string
}) {
  return (
    <div className="bg-white rounded-xl border border-border">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">
          Programs ({programs.length})
        </h2>
        <div className="flex gap-2">
          <Link
            href={`/${locale}/admin/patients/${patientId}/programs/upload`}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-primary transition"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
          </Link>
          <Link
            href={`/${locale}/admin/patients/${patientId}/programs/new`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Create
          </Link>
        </div>
      </div>

      {programs.length > 0 ? (
        <div className="divide-y divide-border">
          {programs.map(program => (
            <div key={program.id} className="px-4 py-3 flex items-center gap-3">
              <FileText className="w-4 h-4 text-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {program.source === 'uploaded'
                    ? program.uploaded_file_name ?? 'Uploaded document'
                    : program.form_data?.primary_diagnosis ?? 'Program'}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {program.source === 'uploaded' ? 'Uploaded' : 'Form-generated'} ·{' '}
                  {format(new Date(program.created_at), 'd MMM yyyy')}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {program.is_active && (
                  <span className="text-xs font-semibold text-success bg-success-bg px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
                <Link
                  href={`/${locale}/admin/patients/${patientId}/programs/${program.id}`}
                  className="text-xs text-primary hover:underline"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-muted text-sm">
          No programs yet
        </div>
      )}
    </div>
  )
}
