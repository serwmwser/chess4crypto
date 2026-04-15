import { useState } from 'react';
import { useAccount } from 'wagmi';

const TOKEN_ADDRESS = '0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444';
const FOUR_MEME_URL = `https://four.meme/token/${TOKEN_ADDRESS}?code=AHGX96R5GHK9`;

export default function BuyTokenButton({ isGuest = false }) {
  const { chain } = useAccount();
  const [isOpen, setIsOpen] = useState(false);

  const isTestnet = chain?.id === 97;

  const handleBuy = () => window.open(FOUR_MEME_URL, '_blank');

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '8px 16px',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#000',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        💰 Купить на four.meme
      </button>

      {isOpen && (
        <div style={styles.overlay} onClick={() => setIsOpen(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#f59e0b', textAlign: 'center' }}>💰 Купить токен GROK</h3>

            {/* 🔥 Рекламный блок 2027 */}
            <div style={styles.promoBox}>
              <p style={styles.promoTitle}>🚀 Листинг на крупных биржах в 2027 году!</p>
              <p style={styles.promoText}>
                Ранние держатели получат бонусы, приоритетный доступ к стейкингу и аирдропы.
              </p>
            </div>

            {isGuest ? (
              <div style={styles.guestInfo}>
                <p style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>🔒 Для покупки подключите кошелёк MetaMask</p>
                <button 
                  onClick={() => { setIsOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                  style={styles.btnBlue}
                >
                  Перейти к подключению
                </button>
              </div>
            ) : (
              <>
                {/* 🔹 Инструкция для пользователя */}
                <div style={styles.instructionBox}>
                  <p style={styles.instructionText}>
                    👉 Перейди на сайт по ссылке и подключи свой крипто кошелёк в сети BNB, на котором есть BNB
                  </p>
                </div>

                <div style={{ color: '#e2e8f0', marginBottom: '1.5rem' }}>
                  <p style={{ margin: '0.5rem 0' }}><strong>Адрес контракта:</strong></p>
                  <code style={styles.code}>{TOKEN_ADDRESS}</code>
                  <p style={{ margin: '1rem 0 0.5rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                    {isTestnet ? '🧪 Тестовая сеть (BSC Testnet)' : '🌐 Основная сеть (BSC Mainnet)'}
                  </p>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <button onClick={handleBuy} style={styles.btnGreen}>
                    🌐 Открыть four.meme
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(TOKEN_ADDRESS); alert('✅ Адрес скопирован!'); }} style={styles.btnGray}>
                    📋 Скопировать адрес контракта
                  </button>
                </div>

                <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
                  ⚠️ Убедитесь, что в кошельке есть BNB для оплаты комиссии сети
                </p>
              </>
            )}

            <button onClick={() => setIsOpen(false)} style={styles.btnClose}>Закрыть</button>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
  modal: { background: '#1e293b', borderRadius: '16px', padding: '1.5rem', maxWidth: '420px', width: '100%', border: '2px solid #f59e0b' },
  promoBox: { background: 'linear-gradient(135deg, #1e3a8a, #312e81)', padding: '1rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid #f59e0b' },
  promoTitle: { margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#fbbf24', textAlign: 'center' },
  promoText: { margin: '0.5rem 0 0 0', color: '#c7d2fe', textAlign: 'center', fontSize: '0.9rem' },
  instructionBox: { background: 'linear-gradient(135deg, #065f46, #047857)', padding: '1rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid #10b981' },
  instructionText: { margin: 0, color: '#d1fae5', textAlign: 'center', fontSize: '0.95rem', fontWeight: '500', lineHeight: '1.4' },
  guestInfo: { textAlign: 'center', padding: '1rem', background: '#1e293b', borderRadius: '8px' },
  code: { display: 'block', background: '#0f172a', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', wordBreak: 'break-all', color: '#4ade80' },
  btnGreen: { padding: '1rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' },
  btnGray: { padding: '0.75rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
  btnBlue: { marginTop: '0.5rem', padding: '0.75rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  btnClose: { marginTop: '1rem', width: '100%', padding: '0.5rem', background: 'transparent', color: '#94a3b8', border: '1px solid #475569', borderRadius: '6px', cursor: 'pointer' }
};