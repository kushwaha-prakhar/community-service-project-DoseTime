import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Medicine } from '../types'
import { format, parse, addMinutes } from 'date-fns'

function formatTime12(t: string) {
  try {
    return format(parse(t, 'HH:mm', new Date()), 'h:mm a')
  } catch {
    return t
  }
}

export default function Medicines() {
  const { user } = useAuth()
  const [meds, setMeds] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [times, setTimes] = useState<string[]>([])
  const [timeInput, setTimeInput] = useState('08:00')
  const [stock, setStock] = useState(30)
  const [alertWhen, setAlertWhen] = useState(5)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (user) loadMeds()
  }, [user])

  async function loadMeds() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('medicines')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setMeds(data || [])
    setLoading(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  function resetForm() {
    setName('')
    setDosage('')
    setTimes([])
    setTimeInput('08:00')
    setStock(30)
    setAlertWhen(5)
    setEditingId(null)
  }

  function startEdit(med: Medicine) {
    setEditingId(med.id)
    setName(med.name)
    setDosage(med.dosage || '')
    setTimes([...(med.times || [])])
    setStock(med.stock ?? 30)
    setAlertWhen(med.alert_when ?? 5)
  }

  function addTime() {
    if (!timeInput) return
    if (!times.includes(timeInput)) {
      setTimes([...times, timeInput].sort())
    }
  }

  function removeTime(t: string) {
    setTimes(times.filter(x => x !== t))
  }

  async function saveMedicine() {
    if (!user) return
    if (!name.trim()) return showToast('Please enter medicine name')
    if (times.length === 0) return showToast('Please add at least one dose time')

    const payload = {
      name: name.trim(),
      dosage: dosage.trim() || null,
      times,
      stock,
      alert_when: alertWhen,
    }

    if (editingId) {
      const { error } = await supabase
        .from('medicines')
        .update(payload)
        .eq('id', editingId)
      if (error) return showToast(error.message)
      showToast('Medicine updated')
    } else {
      const { error } = await supabase.from('medicines').insert({
        ...payload,
        user_id: user.id,
      })
      if (error) return showToast(error.message)
      showToast('Medicine saved')
    }

    resetForm()
    loadMeds()
  }

  async function deleteMedicine(id: string) {
    if (!confirm('Delete this medicine?')) return
    const { error } = await supabase.from('medicines').delete().eq('id', id)
    if (error) return showToast(error.message)
    showToast('Medicine deleted')
    if (editingId === id) resetForm()
    loadMeds()
  }

  async function addDemo() {
    if (!user) return
    const due = addMinutes(new Date(), 1)
    const time = format(due, 'HH:mm')

    const { error } = await supabase.from('medicines').insert({
      user_id: user.id,
      name: 'Demo Pill',
      dosage: '1 tablet',
      times: [time],
      stock: 10,
      alert_when: 3,
    })
    if (error) return showToast(error.message)
    showToast(`Demo added – due at ${formatTime12(time)}`)
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    loadMeds()
  }

  async function resetData() {
    if (!user) return
    if (!confirm('Reset ALL medicines and history for this account? This cannot be undone.')) return

    await supabase.from('dose_logs').delete().eq('user_id', user.id)
    await supabase.from('medicines').delete().eq('user_id', user.id)
    showToast('Data reset')
    resetForm()
    loadMeds()
  }

  return (
    <div className="space-y-4">
      {/* Add / Edit form */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-4">{editingId ? 'Edit medicine' : 'Add medicine'}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-input border border-border rounded-lg outline-none focus:border-teal"
              placeholder="e.g. Metformin"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Dosage</label>
            <input
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-input border border-border rounded-lg outline-none focus:border-teal"
              placeholder="e.g. 500 mg, 1 tablet"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Dose times</label>
            <div className="flex gap-2 mb-2">
              <input
                type="time"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                className="px-3 py-2 bg-input border border-border rounded-lg outline-none focus:border-teal"
              />
              <button
                type="button"
                onClick={addTime}
                className="px-3 py-2 border border-border rounded-lg text-sm text-teal hover:bg-[#1a2e2e]"
              >
                + Add time
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {times.length === 0 && (
                <span className="text-sm text-slate-500">No times yet</span>
              )}
              {times.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal/15 text-teal text-sm"
                >
                  {formatTime12(t)}
                  <button onClick={() => removeTime(t)} className="hover:text-teal-light">×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Stock (pills left)</label>
              <input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-input border border-border rounded-lg outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Alert when ≤</label>
              <input
                type="number"
                min={0}
                value={alertWhen}
                onChange={(e) => setAlertWhen(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-input border border-border rounded-lg outline-none focus:border-teal"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={saveMedicine}
              className="px-5 py-2.5 bg-teal text-bg font-semibold rounded-lg hover:bg-teal-light"
            >
              {editingId ? 'Update medicine' : 'Save medicine'}
            </button>
            <button
              onClick={addDemo}
              className="px-4 py-2.5 border border-border text-teal rounded-lg hover:bg-[#1a2e2e] text-sm"
            >
              Add demo (due in 1 min)
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className="px-4 py-2.5 border border-border text-slate-300 rounded-lg hover:bg-[#1a2e2e] text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-3">My medicines ({meds.length})</h2>
        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : meds.length === 0 ? (
          <p className="text-slate-400 text-sm py-4 text-center">Nothing yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {meds.map((m) => {
              const low = m.stock <= (m.alert_when ?? 5)
              return (
                <div key={m.id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{m.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {m.dosage} · Stock:{' '}
                      <span className={low ? 'text-orange-400 font-semibold' : ''}>
                        {m.stock}
                      </span>
                    </div>
                    <div className="text-xs text-teal mt-1">
                      {(m.times || []).map(formatTime12).join(' · ')}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => startEdit(m)}
                      className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-[#1a2e2e]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteMedicine(m.id)}
                      className="px-3 py-1.5 text-xs text-red-400 border border-red-400/30 rounded-lg hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Reset */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-3">Data</h2>
        <button
          onClick={resetData}
          className="w-full py-2.5 text-red-400 border border-red-400/30 rounded-lg hover:bg-red-500/10 text-sm font-medium"
        >
          Reset all my data
        </button>
        <p className="text-xs text-slate-500 mt-2">
          Clears medicines & history for this account only.
        </p>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-teal text-slate-100 px-5 py-3 rounded-xl text-sm shadow-xl z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
