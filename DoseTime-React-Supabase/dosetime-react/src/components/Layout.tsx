import { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

interface LayoutProps {
  children: ReactNode
  activeTab: 'today' | 'medicines' | 'history'
  onTabChange: (tab: 'today' | 'medicines' | 'history') => void
}

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const { profile, signOut } = useAuth()

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-10 min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between mb-5 pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-base">
            💊
          </div>
          <span className="text-xl font-bold text-teal">DoseTime</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span>Hi, {profile?.name || 'User'}</span>
          <button
            onClick={() => signOut()}
            className="px-3.5 py-1.5 bg-card border border-border rounded-full text-slate-200 hover:bg-[#1a2e2e] transition text-sm"
          >
            Log out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="flex gap-2 mb-5 p-1.5 bg-card border border-border rounded-2xl">
        {(['today', 'medicines', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold capitalize transition ${
              activeTab === tab
                ? 'bg-teal text-bg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a2e2e]'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      <main>{children}</main>
    </div>
  )
}
