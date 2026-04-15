import { useState, useEffect, useRef } from 'react';

export default function ChatBox({ socket, gameId, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    if (!socket || !gameId) return;
    const handle = (msg) => setMessages(prev => [...prev, msg]);
    socket.on('chatMessage', handle);
    return () => socket.off('chatMessage', handle);
  }, [socket, gameId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    const msg = { user, text: input.trim(), time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) };
    socket.emit('chatMessage', { gameId, ...msg });
    setInput('');
  };

  return (
    <div style={{ background: '#1e293b', borderRadius: '12px', padding: '1rem', marginTop: '1rem', maxHeight: '350px', display: 'flex', flexDirection: 'column', border: '1px solid #334155' }}>
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#f59e0b' }}>💬 Чат игры</h3>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '0.5rem', paddingRight: '0.5rem', minHeight: '150px' }}>
        {messages.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center', marginTop: '2rem' }}>Сообщений пока нет</p> :
          messages.map((m, i) => (
            <div key={i} style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{m.user?.slice(0,6) || 'Гость'}:</span>{' '}
              <span style={{ color: '#e2e8f0' }}>{m.text}</span>
              <span style={{ color: '#475569', fontSize: '0.7rem', marginLeft: '4px' }}>{m.time}</span>
            </div>
          ))
        }
        <div ref={endRef} />
      </div>
      <form onSubmit={send} style={{ display: 'flex', gap: '0.5rem' }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Напишите сообщение..." style={{ flex: 1, padding: '0.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', outline: 'none' }} />
        <button type="submit" style={{ padding: '0.5rem 0.8rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>📤</button>
      </form>
    </div>
  );
}