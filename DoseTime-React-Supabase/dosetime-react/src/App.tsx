import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import Auth from './components/Auth'
import Layout from './components/Layout'
import Today from './components/Today'
import Medicines from './components/Medicines'
import History from './components/History'

export default function App() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState<'today' | 'medicines' | 'history'>('today')

  // Request notification permission once logged in
  useEffect(() => {
    if (user && 'Notification' in window && Notification.permission === 'default') {
      // Soft request after a short delay
      const t = setTimeout(() => {
        Notification.requestPermission()
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-slate-400">Loading…</div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <Layout activeTab={tab} onTabChange={setTab}>
      {tab === 'today' && <Today />}
      {tab === 'medicines' && <Medicines />}
      {tab === 'history' && <History />}
    </Layout>
  )
}
