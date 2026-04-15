import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { bsc } from 'wagmi/chains';

const GROK_CONTRACT = '0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444';
const GROK_BUY_URL = `https://four.meme/token/${GROK_CONTRACT}?code=AHGX96R5GHK9`;

export default function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, isPending, error,  status } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  
  const [showModal, setShowModal] = useState(false);
  const [showGrokGuide, setShowGrokGuide] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastError, setLastError] = useState(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (error) {
      console.error('❌ Wagmi connection error:', error);
      setLastError(error);
    }
  }, [error]);

  useEffect(() => {
    if (isConnected && chain?.id !== bsc.id && chain?.id !== 97) {
      switchChain({ chainId: bsc.id }).catch(() => {});
    }
  }, [isConnected, chain, switchChain]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(GROK_CONTRACT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) { console.error('Copy failed:', err); }
  };

  const handleConnect = async (connector) => {
    try {
      await connect({ connector });
      setShowModal(false);
      setTimeout(() => setShowGrokGuide(true), 800);
    } catch (err) {
      console.error('❌ Connection failed:', err);
      setLastError(err);
      alert(`❌ Ошибка: ${err.shortMessage || err.message}`);
    }
  };

  if (!mounted) return <button disabled style={styles.btnDisabled}>⏳ Загрузка...</button>;

  // ✅ Подключено
  if (isConnected && address) {
    return (
      <div style={styles.connectedContainer}>
        <button onClick={() => disconnect()} style={styles.disconnectBtn}>
          🔗 {address.slice(0, 6)}...{address.slice(-4)}
        </button>
        <button onClick={() => setShowGrokGuide(true)} style={styles.grokBtn}>🐸 Купить GROK</button>

        {showGrokGuide && (
          <div style={styles.overlay} onClick={() => setShowGrokGuide(false)}>
            <div style={styles.grokModal} onClick={(e) => e.stopPropagation()}>
              <h3 style={styles.grokTitle}>🐸 Купить токен GROK</h3>
              <div style={styles.stepsContainer}>
                <div style={styles.step}>
                  <span style={styles.stepNum}>1</span>
                  <p style={styles.stepText}>Перейди на four.meme и подключи кошелёк в сети <strong>BNB Chain</strong>:</p>
                  <a href={GROK_BUY_URL} target="_blank" rel="noopener noreferrer" style={styles.linkBtn}>🔗 Открыть four.meme →</a>
                </div>
                <div style={styles.step}>
                  <span style={styles.stepNum}>2</span>
                  <p style={styles.stepText}>Убедись, что на кошельке есть <strong>BNB</strong> для газа.</p>
                </div>
                <div style={styles.step}>
                  <span style={styles.stepNum}>3</span>
                  <p style={styles.stepText}>Купи монету <strong>GROK</strong> на любую сумму.</p>
                </div>
                <div style={styles.step}>
                  <span style={styles.stepNum}>4</span>
                  <p style={styles.stepText}>Добавь токен в кошелёк (адрес контракта):</p>
                  <div style={styles.contractBox}>
                    <code style={styles.contractCode}>{GROK_CONTRACT}</code>
                    <button onClick={copyAddress} style={styles.copyBtn}>{copied ? '✅ Скопировано' : '📋 Копировать'}</button>
                  </div>
                </div>
              </div>
              <div style={styles.footer}>
                <a href={GROK_BUY_URL} target="_blank" rel="noopener noreferrer" style={styles.primaryBtn}>🚀 Начать покупку GROK</a>
                <button onClick={() => setShowGrokGuide(false)} style={styles.closeBtn}>Закрыть</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ❌ Не подключено: модалка
  return (
    <>
      <button onClick={() => setShowModal(true)} style={styles.connectBtn}>🦊 Подключить / Купить GROK</button>

      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>🔗 Подключите кошелёк</h3>
            <p style={styles.modalSubtitle}>Для покупки GROK подключите кошелёк в сети <strong>BNB Chain</strong>.</p>

            {lastError && (
              <div style={styles.errorBox}>
                <p style={styles.errorTitle}>⚠️ Ошибка:</p>
                <p style={styles.errorMessage}>{lastError.shortMessage || lastError.message}</p>
                <button onClick={() => setLastError(null)} style={styles.errorCloseBtn}>Закрыть</button>
              </div>
            )}

            <div style={styles.connectorsGrid}>
              {connectors.map((conn) => (
                <button
                  key={conn.uid || conn.id}
                  onClick={() => handleConnect(conn)}
                  style={{
                    ...styles.connectorBtn,
                    opacity: isPending ? 0.5 : 1,
                    cursor: isPending ? 'not-allowed' : 'pointer'
                  }}
                  disabled={isPending}
                >
                  {conn.name} {isPending ? '⏳' : ''}
                </button>
              ))}
            </div>

            <div style={styles.grokQuickSection}>
              <p style={styles.grokQuickTitle}>🐸 Купить GROK</p>
              <button onClick={() => { setShowModal(false); setShowGrokGuide(true); }} style={styles.grokQuickBtn}>
                Показать инструкцию →
              </button>
            </div>

            <button onClick={() => setShowModal(false)} style={styles.closeBtn}>Закрыть</button>
          </div>
        </div>
      )}
    </>
  );
}

// 🎨 СТИЛИ С ГАРАНТИРОВАННЫМ ЦЕНТРИРОВАНИЕМ
const styles = {
  connectedContainer: { display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' },
  disconnectBtn: { padding: '8px 12px', background: '#1e293b', color: '#4ade80', border: '1px solid #4ade80', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' },
  grokBtn: { padding: '8px 12px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' },
  connectBtn: { padding: '9px 15px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' },
  btnDisabled: { padding: '9px 15px', background: '#475569', color: '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'not-allowed' },
  
  // ✅ Overlay: фиксирован на весь экран + центрирование через flex
  overlay: { 
    position: 'fixed', 
    top: 0, left: 0, right: 0, bottom: 0, 
    background: 'rgba(0,0,0,0.85)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 9999, 
    padding: '1rem',
    backdropFilter: 'blur(4px)',
    overflow: 'hidden' // ✅ Предотвращает прокрутку всей страницы
  },
  
  // ✅ Modal: центрирован + прокрутка внутри, если контент не помещается
  modal: { 
    background: '#0f172a', 
    borderRadius: '14px', 
    padding: '1.5rem', 
    maxWidth: '360px', 
    width: '90%', 
    border: '2px solid #3b82f6', 
    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
    maxHeight: '90vh',  // ✅ Не выше 90% высоты экрана
    overflowY: 'auto',  // ✅ Прокрутка внутри модалки, если нужно
    margin: 'auto'      // ✅ Фоллбэк-центрирование
  },
  
  modalTitle: { color: '#f59e0b', marginBottom: '0.5rem', textAlign: 'center', margin: '0 0 0.5rem 0' },
  modalSubtitle: { color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1rem', lineHeight: '1.4' },
  
  errorBox: { background: 'rgba(239,68,68,0.15)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem' },
  errorTitle: { color: '#fca5a5', fontWeight: 'bold', margin: '0 0 0.3rem 0', fontSize: '0.9rem' },
  errorMessage: { color: '#fecaca', fontSize: '0.85rem', margin: '0 0 0.5rem 0' },
  errorCloseBtn: { padding: '0.4rem 0.8rem', background: '#475569', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' },
  
  connectorsGrid: { display: 'grid', gap: '0.5rem', marginBottom: '1rem' },
  connectorBtn: { padding: '0.85rem', background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '8px', fontWeight: '500', fontSize: '0.95rem', transition: '0.2s' },
  
  grokQuickSection: { background: 'rgba(34,197,94,0.1)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', textAlign: 'center' },
  grokQuickTitle: { color: '#22c55e', fontWeight: 'bold', margin: '0 0 0.3rem 0' },
  grokQuickBtn: { padding: '0.6rem 1rem', background: '#22c55e', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' },
  closeBtn: { width: '100%', padding: '0.6rem', background: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: '8px', cursor: 'pointer' },
  
  // GROK modal: тоже с центрированием и прокруткой
  grokModal: { 
    background: '#0f172a', 
    borderRadius: '14px', 
    padding: '1.5rem', 
    maxWidth: '420px', 
    width: '95%', 
    border: '2px solid #22c55e', 
    boxShadow: '0 12px 40px rgba(34,197,94,0.3)',
    maxHeight: '90vh',  // ✅ Не выше 90% экрана
    overflowY: 'auto',  // ✅ Прокрутка внутри
    margin: 'auto'      // ✅ Фоллбэк
  },
  grokTitle: { color: '#22c55e', marginBottom: '1rem', textAlign: 'center', margin: '0 0 1rem 0', fontSize: '1.2rem', position: 'sticky', top: 0, background: '#0f172a', paddingTop: '0.5rem', zIndex: 1 },
  stepsContainer: { display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' },
  step: { display: 'flex', gap: '0.75rem', alignItems: 'flex-start' },
  stepNum: { background: '#22c55e', color: '#000', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0 },
  stepText: { color: '#e2e8f0', fontSize: '0.9rem', margin: 0, lineHeight: '1.4' },
  linkBtn: { display: 'inline-block', padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem', marginTop: '0.3rem' },
  contractBox: { background: '#1e293b', borderRadius: '8px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem', flexWrap: 'wrap' },
  contractCode: { color: '#22c55e', fontSize: '0.75rem', fontFamily: 'monospace', wordBreak: 'break-all', flex: '1 1 100%' },
  copyBtn: { padding: '0.4rem 0.8rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' },
  footer: { display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'sticky', bottom: 0, background: '#0f172a', paddingTop: '1rem', marginTop: 'auto' },
  primaryBtn: { padding: '0.85rem', background: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', textDecoration: 'none', textAlign: 'center' }
};