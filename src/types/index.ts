// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'doctor'

export type PatientStatus =
  | 'lead'
  | 'follow_up'
  | 'didnt_reply'
  | 'booked'
  | 'active'
  | 'paused'
  | 'discharged'
  | 'lost'

export type SourceChannel = 'phone' | 'whatsapp' | 'referral' | 'other'

export type VisitType = 'assessment' | 'treatment' | 'discharge'

export type VisitStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled'

export type NoteReviewStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'approved_with_comment'
  | 'returned'

export type ReviewActionType = 'approve' | 'approve_with_comment' | 'send_back'

export type PatientResponse = 'better' | 'same' | 'worse' | 'mixed'

export type ProgramSource = 'uploaded' | 'form_generated'

export type Gender = 'male' | 'female'

// ─── Location ─────────────────────────────────────────────────────────────────

export interface Location {
  place_id: string
  display_name: string
  lat: number
  lng: number
  city?: string
}

// ─── User / Auth ──────────────────────────────────────────────────────────────

export interface AppUser {
  id: string
  email: string
  role: UserRole
  full_name: string
  phone?: string
  avatar_url?: string
  created_at: string
}

// ─── Doctor ───────────────────────────────────────────────────────────────────

export interface Doctor {
  id: string
  user_id: string
  full_name: string
  phone: string
  email: string
  specialty: string
  gender: Gender
  covered_locations: Location[]
  is_active: boolean
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface DoctorWithStats extends Doctor {
  active_patients_count: number
  visits_this_month: number
  avg_review_score?: number
}

// ─── Patient ──────────────────────────────────────────────────────────────────

export interface Patient {
  id: string
  full_name: string
  phone: string
  date_of_birth?: string
  gender?: Gender
  address: Location
  secondary_addresses?: Location[]
  complaint: string
  source_channel: SourceChannel
  status: PatientStatus
  referring_physician?: string
  assigned_doctor_id?: string
  assigned_doctor?: Doctor
  payment_status?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface PatientStatusHistory {
  id: string
  patient_id: string
  from_status?: PatientStatus
  to_status: PatientStatus
  changed_by: string
  note?: string
  created_at: string
}

export interface PatientWithHistory extends Patient {
  status_history: PatientStatusHistory[]
}

// ─── Visit ────────────────────────────────────────────────────────────────────

export interface Visit {
  id: string
  patient_id: string
  patient?: Patient
  doctor_id: string
  doctor?: Doctor
  location: Location
  type: VisitType
  status: VisitStatus
  scheduled_at: string
  started_at?: string
  completed_at?: string
  cancellation_reason?: string
  next_visit_recommendation?: string
  payment_confirmed: boolean
  created_at: string
  updated_at: string
}

export interface VisitWithNote extends Visit {
  note?: VisitNote
}

// ─── Visit Notes ──────────────────────────────────────────────────────────────

export interface QuickSheet {
  pain_before: number // 0-10
  pain_after: number // 0-10
  what_was_done: string[]
  patient_response: PatientResponse
  next_visit_recommendation: string
  red_flags_noted: boolean
  red_flags_detail?: string
}

export interface SOAPNote {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

export interface Measurement {
  label: string
  value: string
  unit?: string
  side?: 'left' | 'right' | 'bilateral'
}

export interface FullSheet {
  soap?: SOAPNote
  measurements?: Measurement[]
  photos?: string[] // storage URLs
  discharge_criteria_progress?: string
  program_modifications?: string
}

export interface VisitNote {
  id: string
  visit_id: string
  doctor_id: string
  program_id?: string
  quick_sheet: QuickSheet
  full_sheet?: FullSheet
  review_status: NoteReviewStatus
  submitted_at?: string
  reviewed_at?: string
  reviewed_by?: string
  review_comment?: string
  created_at: string
  updated_at: string
}

// ─── Review ───────────────────────────────────────────────────────────────────

export interface ReviewAction {
  id: string
  note_id: string
  admin_id: string
  action: ReviewActionType
  comment?: string
  created_at: string
}

// ─── Programs ─────────────────────────────────────────────────────────────────

export interface Exercise {
  id: string
  name: string
  name_ar?: string
  position?: string
  description?: string
  description_ar?: string
  dosage_hint?: string
  dosage_type: 'sets_reps' | 'duration'
  default_sets?: number
  default_reps?: number
  default_duration_seconds?: number
  photo_url?: string
  video_url?: string
  notes?: string
  flagged_for_review: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface ProgramExercise {
  exercise_id: string
  exercise?: Exercise
  sets?: number
  reps?: number
  duration_seconds?: number
  notes?: string
  position?: string
}

export interface Phase {
  number: number
  goal: string
  goal_ar?: string
  weeks: number
  visits_per_week: number
  exercises?: ProgramExercise[]
  progression_criteria?: string[]
  home_exercises?: ProgramExercise[]
}

export interface BaselineAssessment {
  pain_score: number
  measurements?: Measurement[]
  special_tests?: string[]
  notes?: string
}

export interface RedFlag {
  description: string
  description_ar?: string
}

// Tier 1 — mandatory
export interface ProgramCore {
  primary_diagnosis: string
  referring_physician?: string
  referring_physician_specialty?: string
  self_referred: boolean
  duration_weeks: number
  phase_count: 1 | 2 | 3
  phases: Phase[]
  baseline_pain_score: number
  red_flags: RedFlag[]
}

// Tier 2 — optional blocks
export interface ProgramOptionalBlocks {
  secondary_diagnoses?: string[]
  baseline_assessment?: BaselineAssessment
  custom_sections?: { title: string; body: string }[]
}

export interface ProgramFormData extends ProgramCore, ProgramOptionalBlocks {}

export interface Program {
  id: string
  patient_id: string
  patient?: Patient
  doctor_id: string
  source: ProgramSource
  uploaded_file_url?: string
  uploaded_file_name?: string
  form_data?: ProgramFormData
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string
  label: string
  label_ar?: string
}

export interface TableColumn<T> {
  key: keyof T | string
  header: string
  header_ar?: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  per_page: number
}

export interface ApiError {
  message: string
  code?: string
}
