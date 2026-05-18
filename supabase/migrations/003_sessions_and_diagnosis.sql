-- Add diagnosis fields to patients
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS primary_diagnosis text,
  ADD COLUMN IF NOT EXISTS primary_icd       text,
  ADD COLUMN IF NOT EXISTS secondary_diagnoses jsonb NOT NULL DEFAULT '[]';

-- Clinic sessions table (replaces visits for simple session logging)
CREATE TABLE IF NOT EXISTS clinic_sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id     uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id      uuid REFERENCES doctors(id),
  session_number int,
  date           date NOT NULL,
  duration_min   int  NOT NULL DEFAULT 45,
  pain_score     int  CHECK (pain_score >= 0 AND pain_score <= 10),
  outcome        text CHECK (outcome IN ('improving','stable','declining','worsening')),
  next_appointment date,
  notes          text,
  exercises      text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clinic_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do anything on clinic_sessions"
  ON clinic_sessions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Doctors see their own sessions"
  ON clinic_sessions FOR SELECT
  USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

CREATE POLICY "Doctors insert their own sessions"
  ON clinic_sessions FOR INSERT
  WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

-- Seed MSK diagnoses into apta_diagnoses
INSERT INTO apta_diagnoses (name, name_ar, icd_hint, system) VALUES
  ('Lumbar Disc Herniation',         'انزلاق غضروفي قطني',           'M51.1',  'MSK'),
  ('Cervical Disc Herniation',       'انزلاق غضروفي عنقي',           'M50.1',  'MSK'),
  ('Lumbar Spinal Stenosis',         'تضيق القناة الشوكية القطنية',   'M48.06', 'MSK'),
  ('Knee Osteoarthritis',            'خشونة الركبة',                  'M17.1',  'MSK'),
  ('Hip Osteoarthritis',             'خشونة الورك',                   'M16.1',  'MSK'),
  ('Shoulder Impingement Syndrome',  'متلازمة اصطدام الكتف',          'M75.1',  'MSK'),
  ('Rotator Cuff Tear',              'تمزق الكفة المدورة',            'M75.1',  'MSK'),
  ('Adhesive Capsulitis',            'التهاب المحفظة اللاصق (الكتف المجمد)', 'M75.0', 'MSK'),
  ('Plantar Fasciitis',              'التهاب اللفافة الأخمصية',       'M72.2',  'MSK'),
  ('Achilles Tendinopathy',          'اعتلال وتر أخيل',               'M76.6',  'MSK'),
  ('Anterior Cruciate Ligament Tear','تمزق الرباط الصليبي الأمامي',   'S83.5',  'MSK'),
  ('Patellofemoral Pain Syndrome',   'متلازمة الفخذ الرضفي',          'M22.2',  'MSK'),
  ('Scoliosis',                      'الجنف',                         'M41.9',  'MSK'),
  ('Ankylosing Spondylitis',         'التهاب الفقار اللاصق',          'M45',    'MSK'),
  ('Rheumatoid Arthritis',           'التهاب المفاصل الروماتويدي',    'M06.9',  'MSK'),
  ('Osteoporosis',                   'هشاشة العظام',                  'M81.0',  'MSK'),
  ('Frozen Shoulder',                'الكتف المجمد',                  'M75.0',  'MSK'),
  ('Tennis Elbow (Lateral Epicondylitis)', 'مرفق التنس',             'M77.1',  'MSK'),
  ('Carpal Tunnel Syndrome',         'متلازمة النفق الرسغي',          'G56.0',  'MSK'),
  ('Fibromyalgia',                   'الألم العضلي الليفي',           'M79.7',  'MSK'),
  -- Neurological
  ('Stroke (Ischemic)',              'سكتة دماغية (نقص تروية)',       'I63.9',  'Neuro'),
  ('Stroke (Hemorrhagic)',           'سكتة دماغية (نزيف)',            'I61.9',  'Neuro'),
  ('Hemiplegia',                    'شلل نصفي',                      'G81.9',  'Neuro'),
  ('Paraplegia',                    'شلل سفلي',                      'G82.2',  'Neuro'),
  ('Multiple Sclerosis',            'التصلب المتعدد',                 'G35',    'Neuro'),
  ('Parkinson''s Disease',          'مرض باركنسون',                  'G20',    'Neuro'),
  ('Guillain–Barré Syndrome',       'متلازمة غيلان باريه',            'G61.0',  'Neuro'),
  ('Peripheral Neuropathy',         'اعتلال الأعصاب الطرفية',         'G60.9',  'Neuro'),
  ('Bell''s Palsy',                 'شلل بيل',                       'G51.0',  'Neuro'),
  ('Spinal Cord Injury',            'إصابة الحبل الشوكي',             'T09.3',  'Neuro'),
  ('Traumatic Brain Injury',        'إصابة الدماغ الرضية',            'S09.9',  'Neuro'),
  ('Cerebral Palsy',                'الشلل الدماغي',                  'G80.9',  'Neuro'),
  ('Vestibular Neuritis',           'التهاب العصب الدهليزي',          'H81.2',  'Neuro'),
  ('Benign Paroxysmal Positional Vertigo', 'الدوار الانتيابي الحميد', 'H81.1', 'Neuro'),
  ('Radiculopathy (Cervical)',      'اعتلال الجذور العنقية',           'M54.2',  'Neuro'),
  ('Radiculopathy (Lumbar)',        'اعتلال الجذور القطنية',           'M54.4',  'Neuro')
ON CONFLICT DO NOTHING;
