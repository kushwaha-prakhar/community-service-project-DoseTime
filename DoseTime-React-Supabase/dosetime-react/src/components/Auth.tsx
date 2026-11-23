import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your name')
        setLoading(false)
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        setLoading(false)
        return
      }
      const { error } = await signUp(email.trim(), password, name.trim())
      if (error) setError(error)
      else {
        // Auto login after signup often works, or show message
        setError('')
        // Supabase may require email confirmation depending on settings
      }
    } else {
      const { error } = await signIn(email.trim(), password)
      if (error) setError(error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-xl">
          💊
        </div>
        <h1 className="text-3xl font-bold text-teal">DoseTime</h1>
      </div>
      <p className="text-slate-400 text-sm mb-8 text-center">
        Never miss a dose. Track your adherence.
      </p>

      <div className="w-full max-w-sm bg-card border border-border rounded-xl p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-5">
          {mode === 'login' ? 'Log in' : 'Create account'}
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/15 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-3 bg-input border border-border rounded-lg text-slate-100 outline-none focus:border-teal transition"
                placeholder="Your name"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-3 bg-input border border-border rounded-lg text-slate-100 outline-none focus:border-teal transition"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">
              Password (min 6 chars)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-3 bg-input border border-border rounded-lg text-slate-100 outline-none focus:border-teal transition"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal text-bg font-semibold rounded-lg hover:bg-teal-light transition disabled:opacity-60"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Register'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          {mode === 'login' ? (
            <>
              New here?{' '}
              <button
                onClick={() => { setMode('register'); setError('') }}
                className="text-teal font-medium hover:underline"
              >
                Register
              </button>
            </>
          ) : (
            <>
              Have an account?{' '}
              <button
                onClick={() => { setMode('login'); setError('') }}
                className="text-teal font-medium hover:underline"
              >
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
