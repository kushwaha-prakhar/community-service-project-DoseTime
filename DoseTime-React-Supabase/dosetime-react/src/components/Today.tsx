import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Medicine, DoseLog, ScheduleItem, DoseStatus } from '../types'
import { format, parse } from 'date-fns'

function formatTime12(t: string) {
  try {
    const d = parse(t, 'HH:mm', new Date())
    return format(d, 'h:mm a')
  } catch {
    return t
  }
}

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

export default function Today() {
  const { user } = useAuth()
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (user) loadSchedule()
  }, [user])

  async function loadSchedule() {
    if (!user) return
    setLoading(true)

    const { data: meds } = await supabase
      .from('medicines')
      .select('*')
      .eq('user_id', user.id)

    const { data: logs } = await supabase
      .from('dose_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', todayStr())

    const items: ScheduleItem[] = []
    ;(meds || []).forEach((med: Medicine) => {
      ;(med.times || []).forEach((time) => {
        const log = (logs || []).find(
          (l: DoseLog) => l.medicine_id === med.id && l.scheduled_time === time
        )
        items.push({
          medicineId: med.id,
          name: med.name,
          dosage: med.dosage,
          time,
          status: log ? log.status : null,
          logId: log ? log.id : null,
        })
      })
    })

    items.sort((a, b) => a.time.localeCompare(b.time))
    setSchedule(items)
    setLoading(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  async function markDose(item: ScheduleItem, status: DoseStatus) {
    if (!user) return

    // Delete existing log for this med+time+today if any
    if (item.logId) {
      await supabase.from('dose_logs').delete().eq('id', item.logId)
    }

    const { error } = await supabase.from('dose_logs').insert({
      user_id: user.id,
      medicine_id: item.medicineId,
      med_name: item.name,
      dosage: item.dosage,
      scheduled_time: item.time,
      status,
      date: todayStr(),
    })

    if (error) {
      showToast('Error saving: ' + error.message)
      return
    }

    // Decrement stock on taken / taken_late
    if (status === 'taken' || status === 'taken_late') {
      const { data: med } = await supabase
        .from('medicines')
        .select('stock, alert_when, name')
        .eq('id', item.medicineId)
        .single()

      if (med && typeof med.stock === 'number') {
        const newStock = Math.max(0, med.stock - 1)
        await supabase
          .from('medicines')
          .update({ stock: newStock })
          .eq('id', item.medicineId)

        if (newStock <= (med.alert_when ?? 5)) {
          showToast(`⚠️ Low stock: ${med.name} has ${newStock} left`)
        }
      }
    }

    showToast(
      status === 'taken' ? 'Marked as taken ✓' :
      status === 'taken_late' ? 'Marked as taken late' :
      status === 'missed' ? 'Marked as missed' : 'Skipped'
    )
    loadSchedule()
  }

  const takenCount = schedule.filter(s => s.status === 'taken' || s.status === 'taken_late').length

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 text-center text-slate-400">
        Loading…
      </div>
    )
  }

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base">Today's schedule</h2>
          <span className="text-sm text-slate-400">{takenCount}/{schedule.length} taken</span>
        </div>

        {schedule.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8">
            No doses scheduled. Add a medicine in the Medicines tab.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {schedule.map((item) => (
              <div key={`${item.medicineId}-${item.time}`} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                <div className="text-sm font-semibold text-teal-light min-w-[70px]">
                  {formatTime12(item.time)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{item.name}</div>
                  <div className="text-xs text-slate-400">{item.dosage}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <DoseActions item={item} onMark={markDose} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-teal text-slate-100 px-5 py-3 rounded-xl text-sm shadow-xl z-50">
          {toast}
        </div>
      )}
    </>
  )
}

function DoseActions({
  item,
  onMark,
}: {
  item: ScheduleItem
  onMark: (item: ScheduleItem, status: DoseStatus) => void
}) {
  if (item.status === 'taken') {
    return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal/15 text-teal">taken</span>
  }
  if (item.status === 'taken_late') {
    return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/15 text-yellow-400">taken late</span>
  }
  if (item.status === 'skipped') {
    return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-400">skipped</span>
  }
  if (item.status === 'missed') {
    return (
      <>
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400">missed</span>
        <button
          onClick={() => onMark(item, 'taken_late')}
          className="px-3 py-1.5 bg-teal text-bg text-xs font-semibold rounded-lg hover:bg-teal-light"
        >
          Taken late
        </button>
      </>
    )
  }

  // Pending – check if past due
  const now = new Date()
  const [h, m] = item.time.split(':').map(Number)
  const due = new Date()
  due.setHours(h, m, 0, 0)
  const isPast = now > due

  if (isPast) {
    return (
      <>
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400">missed</span>
        <button
          onClick={() => onMark(item, 'taken_late')}
          className="px-3 py-1.5 bg-teal text-bg text-xs font-semibold rounded-lg hover:bg-teal-light"
        >
          Taken late
        </button>
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => onMark(item, 'taken')}
        className="px-3 py-1.5 bg-teal text-bg text-xs font-semibold rounded-lg hover:bg-teal-light"
      >
        Taken
      </button>
      <button
        onClick={() => onMark(item, 'skipped')}
        className="px-3 py-1.5 border border-border text-slate-300 text-xs font-semibold rounded-lg hover:bg-[#1a2e2e]"
      >
        Skip
      </button>
    </>
  )
}
