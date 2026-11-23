export interface Profile {
  id: string
  name: string | null
  created_at?: string
}

export interface Medicine {
  id: string
  user_id: string
  name: string
  dosage: string | null
  times: string[]
  stock: number
  alert_when: number
  created_at?: string
}

export type DoseStatus = 'taken' | 'taken_late' | 'missed' | 'skipped'

export interface DoseLog {
  id: string
  user_id: string
  medicine_id: string
  med_name: string
  dosage: string | null
  scheduled_time: string
  status: DoseStatus
  date: string // YYYY-MM-DD
  created_at?: string
}

export interface ScheduleItem {
  medicineId: string
  name: string
  dosage: string | null
  time: string
  status: DoseStatus | null
  logId: string | null
}
