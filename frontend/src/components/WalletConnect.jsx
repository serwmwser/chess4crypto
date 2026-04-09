import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useState } from 'react'

export default function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connectors, connect, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  const [showModal, setShowModal] = useState(false)

  // ✅ Если подключено -> показываем адрес и кнопку отключения
  if (isConnected && address) {
    return (
      <button onClick={() => disconnect()} style={styles.btnDisconnect} title="Отключить кошелёк">
        🔗 {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    )
  }

  // ❌ Если не подключено -> кнопка "Подключить" + модальное окно
  return (
    <>
      <button onClick={() => setShowModal(true)} style={styles.btnConnect} disabled={isPending}>
        {isPending ? '⏳ Подключение...' : '🦊 Подключить'}
      </button>

      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#f59e0b', marginBottom: '1rem', textAlign: 'center' }}>Выберите кошелёк</h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {connectors.map((conn) => (
                <button
                  key={conn.uid || conn.id}
                  disabled={!conn.ready || isPending}
                  onClick={() => {
                    connect({ connector: conn })
                    setShowModal(false)
                  }}
                  style={{
                    ...styles.connBtn,
                    opacity: conn.ready ? 1 : 0.4,
                    cursor: conn.ready ? 'pointer' : 'not-allowed'
                  }}
                >
                  {conn.name} {isPending ? '⏳' : ''}
                </button>
              ))}
            </div>
            
            {error && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center', background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '6px' }}>
                ⚠️ {error.shortMessage || error.message}
              </p>
            )}

            <button 
              onClick={() => setShowModal(false)} 
              style={{ marginTop: '1rem', width: '100%', padding: '0.6rem', background: '#334155', color: '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  )
}

const styles = {
  btnConnect: { padding: '8px 14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s' },
  btnDisconnect: { padding: '8px 12px', background: '#1e293b', color: '#4ade80', border: '1px solid #4ade80', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem', backdropFilter: 'blur(4px)' },
  modal: { background: '#0f172a', borderRadius: '12px', padding: '1.5rem', maxWidth: '320px', width: '90%', border: '2px solid #3b82f6', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' },
  connBtn: { padding: '0.85rem', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '8px', fontWeight: '500', fontSize: '0.95rem', transition: 'all 0.2s' }
}