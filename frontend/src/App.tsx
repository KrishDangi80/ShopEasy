import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'

type Message = { from: 'user' | 'agent'; text: string }

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function send() {
    if (!text.trim()) return
    const userMessage = { from: 'user' as const, text }
    setMessages((m) => [...m, userMessage])
    setText('')
    setLoading(true)
    try {
      const resp = await axios.post(`${apiBaseUrl}/api/agent`, { message: userMessage.text })
      const reply = resp.data.reply || 'Sorry, no reply.'
      setMessages((m) => [...m, { from: 'agent', text: reply }])
    } catch (err: any) {
      setMessages((m) => [...m, { from: 'agent', text: 'Sorry, I encountered an error. Please try again.' }])
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <h2>ShopEasy Chat Assistant</h2>
      <div className="chat">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', marginTop: 'auto', marginBottom: 'auto' }}>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>👋 Hi! Ask about your order or find alternatives.</p>
            <p style={{ fontSize: '12px' }}>Try: "Has my order ORD-1002 shipped?"</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={'msg ' + m.from}>
            <div className="bubble">{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="msg agent">
            <div className="bubble" style={{ display: 'flex', gap: '4px' }}>
              <span style={{ animation: 'blink 1.4s infinite' }}>●</span>
              <span style={{ animation: 'blink 1.4s infinite 0.2s' }}>●</span>
              <span style={{ animation: 'blink 1.4s infinite 0.4s' }}>●</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="composer">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !loading && send()} placeholder="Ask about your order..." />
        <button onClick={send} disabled={loading}>{loading ? 'Thinking...' : 'Send'}</button>
      </div>
      <style>{`
        @keyframes blink {
          0%, 20%, 50%, 80%, 100% { opacity: 1; }
          40% { opacity: 0.3; }
          60% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
