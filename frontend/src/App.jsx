import { useState, useEffect } from 'react'

export default function App() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // ✅ Маркер: если это отобразилось — приложение работает
    setLoaded(true)
    console.log('✅ App component mounted')
  }, [])

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0b1120', 
      color: '#e2e8f0',
      padding: '1rem'
    }}>
      {/* ✅ Яркий заголовок — гарантия видимости */}
      <header style={{ 
        background: 'linear-gradient(135deg, #1e293b, #0f172a)', 
        padding: '1rem', 
        borderRadius: '12px',
        border: '2px solid #3b82f6',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          color: '#f59e0b', 
          fontSize: '1.5rem', 
          margin: 0,
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          ♟️ Chess4Crypto
        </h1>
        <p style={{ color: '#94a3b8', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
          {loaded ? '✅ Приложение загружено!' : '⏳ Загрузка...'}
        </p>
      </header>

      {/* ✅ Контент с высоким контрастом */}
      <main style={{ 
        background: '#1e293b', 
        borderRadius: '12px', 
        padding: '1.5rem',
        border: '1px solid #334155'
      }}>
        <h2 style={{ color: '#fff', margin: '0 0 1rem 0' }}>🎮 Главная</h2>
        <p style={{ color: '#e2e8f0', lineHeight: 1.6 }}>
          Добро пожаловать в Chess4Crypto — шахматы с ставками в токене GROK на BNB Chain.
        </p>
        
        {/* ✅ Яркая кнопка для проверки интерактивности */}
        <button 
          onClick={() => alert('🎉 Кнопка работает! Приложение активно.')}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            background: '#22c55e',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'transform 0.1s'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          🎯 Проверить интерактивность
        </button>

        {/* ✅ Ссылка на профиль */}
        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #334155' }}>
          <a 
            href="/profile" 
            style={{ 
              color: '#3b82f6', 
              textDecoration: 'none', 
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            👤 Перейти в профиль →
          </a>
        </div>
      </main>

      {/* ✅ Футер с диагностикой */}
      <footer style={{ 
        marginTop: '2rem', 
        textAlign: 'center', 
        color: '#475569', 
        fontSize: '0.8rem' 
      }}>
        <p>© 2026 Chess4Crypto | BNB Chain • GROK Token</p>
        <p style={{ marginTop: '0.3rem' }}>
          🌐 {window.location.hostname} | 🕐 {new Date().toLocaleTimeString()}
        </p>
      </footer>
    </div>
  )
}