import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState, useEffect } from 'react';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [showModal, setShowModal] = useState(false);

  if (isConnected && address) {
    return (
      <button onClick={() => disconnect()} style={styles.btnDisconnect}>
        🔗 {address.slice(0,6)}...{address.slice(-4)}
      </button>
    );
  }

  return (
    <>
      <button onClick={() => setShowModal(true)} style={styles.btnConnect} disabled={isPending}>
        {isPending ? '⏳...' : '🦊 Подключить'}
      </button>

      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#f59e0b', marginBottom: '1rem', textAlign: 'center' }}>Выберите кошелёк</h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {connectors?.map(conn => (
                <button
                  key={conn.uid || conn.id}
                  disabled={!conn.ready || isPending}
                  onClick={() => { 
                    connect({ connector: conn }).catch(e => console.error('Connect err:', e)); 
                    setShowModal(false); 
                  }}
                  style={styles.connBtn}
                >
                  {conn.name} {isPending ? '⏳' : ''}
                </button>
              ))}
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>{error.shortMessage}</p>}
            <button onClick={() => setShowModal(false)} style={{ marginTop: '1rem', width: '100%', padding: '0.6rem', background: '#334155', color: '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Закрыть</button>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  btnConnect: { padding: '8px 14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' },
  btnDisconnect: { padding: '8px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' },
  modal: { background: '#1e293b', borderRadius: '12px', padding: '1.5rem', maxWidth: '350px', width: '90%', border: '2px solid #f59e0b' },
  connBtn: { padding: '0.85rem', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '0.95rem' }
};