import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { DoseLog } from '../types'
import { format, subDays, parseISO } from 'date-fns'

function formatTime12(t: string) {
  try {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
  } catch {
    return t
  }
}

export default function History() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<DoseLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadLogs()
  }, [user])

  async function loadLogs() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('dose_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(300)
    setLogs(data || [])
    setLoading(false)
  }

  // Stats last 30 days
  const cutoff = subDays(new Date(), 30)
  const recent = logs.filter(l => {
    try {
      return parseISO(l.date) >= cutoff
    } catch {
      return false
    }
  })

  let taken = 0, skipped = 0, missed = 0
  recent.forEach(l => {
    if (l.status === 'taken' || l.status === 'taken_late') taken++
    else if (l.status === 'skipped') skipped++
    else if (l.status === 'missed') missed++
  })
  const total = taken + skipped + missed
  const adherence = total === 0 ? 0 : Math.round((taken / total) * 100)

  // Streak
  const byDate: Record<string, boolean> = {}
  logs.forEach(l => {
    if (l.status === 'taken' || l.status === 'taken_late') byDate[l.date] = true
  })
  let streak = 0
  const d = new Date()
  for (let i = 0; i < 60; i++) {
    const key = format(d, 'yyyy-MM-dd')
    if (byDate[key]) {
      streak++
      d.setDate(d.getDate() - 1)
    } else {
      if (i === 0) {
        d.setDate(d.getDate() - 1)
        continue
      }
      break
    }
  }

  // Last 7 days chart
  const last7 = []
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  for (let i = 6; i >= 0; i--) {
    const day = subDays(new Date(), i)
    const key = format(day, 'yyyy-MM-dd')
    const dayLogs = logs.filter(l => l.date === key)
    const dayTaken = dayLogs.filter(l => l.status === 'taken' || l.status === 'taken_late').length
    const dayTotal = dayLogs.length
    const pct = dayTotal === 0 ? 0 : Math.round((dayTaken / dayTotal) * 100)
    last7.push({ label: labels[day.getDay()], pct })
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 text-center text-slate-400">
        Loading…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-4">Adherence (last 30 days)</h2>
        <div className="grid grid-cols-5 gap-2">
          <StatBox value={`${adherence}%`} label="taken" color="text-teal" />
          <StatBox
            value={
              <span className="flex items-center justify-center gap-1">
                <span>🔥</span> {streak}
              </span>
            }
            label="day streak"
          />
          <StatBox value={taken} label="taken" color="text-green-400" />
          <StatBox value={skipped} label="skipped" color="text-orange-400" />
          <StatBox value={missed} label="missed" color="text-red-400" />
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-4">Last 7 days</h2>
        <div className="flex items-end justify-between h-24 gap-1.5">
          {last7.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <div
                className={`w-full max-w-[36px] rounded-t ${d.pct === 0 ? 'bg-border h-0.5' : 'bg-teal'}`}
                style={{ height: d.pct === 0 ? 2 : `${Math.max(d.pct, 4)}%` }}
              />
              <span className="text-[11px] text-slate-400 mt-1.5">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-3">Recent activity</h2>
        {logs.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">No activity yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {logs.slice(0, 25).map((l) => {
              const statusClass =
                l.status === 'taken' || l.status === 'taken_late'
                  ? 'bg-teal/15 text-teal'
                  : l.status === 'missed'
                  ? 'bg-red-500/15 text-red-400'
                  : 'bg-orange-500/15 text-orange-400'
              const statusText = l.status === 'taken_late' ? 'taken late' : l.status
              return (
                <div key={l.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <div className="text-sm font-medium">{l.med_name}</div>
                    <div className="text-xs text-slate-400">
                      {l.date} · {formatTime12(l.scheduled_time)}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                    {statusText}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatBox({
  value,
  label,
  color = 'text-slate-100',
}: {
  value: React.ReactNode
  label: string
  color?: string
}) {
  return (
    <div className="bg-input rounded-lg py-3 px-1 text-center">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[11px] text-slate-400 mt-0.5">{label}</div>
    </div>
  )
}
