import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState } from 'react';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
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
      <button onClick={() => setShowModal(true)} style={styles.btnConnect}>
        🦊 Подключить кошелёк
      </button>

      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.title}>Выберите кошелёк</h3>
            <div style={styles.list}>
              {connectors.map((connector) => (
                <button
                  key={connector.uid || connector.id}
                  disabled={!connector.ready || isPending}
                  onClick={() => {
                    connect({ connector });
                    setShowModal(false);
                  }}
                  style={styles.connBtn}
                >
                  {connector.name} {isPending ? '⏳' : ''}
                </button>
              ))}
            </div>
            <button onClick={() => setShowModal(false)} style={styles.closeBtn}>Закрыть</button>
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
  modal: { background: '#1e293b', borderRadius: '16px', padding: '1.5rem', maxWidth: '380px', width: '100%', border: '2px solid #f59e0b', textAlign: 'center' },
  title: { margin: '0 0 1rem 0', color: '#f59e0b', fontSize: '1.2rem' },
  list: { display: 'grid', gap: '0.5rem', marginBottom: '1rem' },
  connBtn: { padding: '0.85rem', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '500', fontSize: '0.95rem', transition: '0.2s' },
  closeBtn: { width: '100%', padding: '0.6rem', background: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: '8px', cursor: 'pointer' }
};