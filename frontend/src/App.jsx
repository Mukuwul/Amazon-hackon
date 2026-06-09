import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export default function App() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setMessages((m) => [...m, { role: 'user', text }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', text: data.reply }])
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', text: 'Error: ' + e.message }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center">
      <header className="w-full border-b border-neutral-800 py-4 px-6">
        <h1 className="text-lg font-semibold tracking-tight">HackOn Starter</h1>
        <p className="text-xs text-neutral-500">FastAPI + Bedrock + React — swap the prompt, ship the idea.</p>
      </header>

      <main className="w-full max-w-2xl flex-1 flex flex-col gap-3 px-4 py-6">
        {messages.length === 0 && (
          <p className="text-neutral-600 text-sm text-center mt-12">
            Type a message to test the full stack end-to-end.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              'rounded-2xl px-4 py-3 text-sm max-w-[85%] ' +
              (m.role === 'user'
                ? 'self-end bg-indigo-600 text-white'
                : 'self-start bg-neutral-800 text-neutral-100')
            }
          >
            {m.text}
          </div>
        ))}
        {loading && <div className="self-start text-neutral-500 text-sm px-2">thinking…</div>}
      </main>

      <footer className="w-full max-w-2xl px-4 pb-6">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm outline-none focus:border-indigo-500"
            placeholder="Ask something…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button
            onClick={send}
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  )
}
