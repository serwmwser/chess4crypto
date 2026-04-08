// frontend/src/components/BuyTokenButton.jsx
import { useState } from 'react';
import { useAccount } from 'wagmi';

const TOKEN_ADDRESS = '0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444';
const PANCAKE_SWAP_URL = `https://pancakeswap.finance/swap?outputCurrency=${TOKEN_ADDRESS}&chainId=97`;

export default function BuyTokenButton() {
  const { chain } = useAccount();
  const [isOpen, setIsOpen] = useState(false);

  // Определяем сеть и подбираем ссылку
  const isTestnet = chain?.id === 97; // BSC Testnet
  const swapUrl = isTestnet 
    ? `${PANCAKE_SWAP_URL}&chainId=97` 
    : `https://pancakeswap.finance/swap?outputCurrency=${TOKEN_ADDRESS}`;

  const handleBuy = () => {
    window.open(swapUrl, '_blank');
  };

  return (
    <>
      {/* Кнопка в меню */}
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
        💰 Купить GROK
      </button>

      {/* Модальное окно */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={() => setIsOpen(false)}>
          
          <div style={{
            background: '#1e293b',
            borderRadius: '16px',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '100%',
            border: '2px solid #f59e0b'
          }} onClick={e => e.stopPropagation()}>
            
            <h3 style={{ margin: '0 0 1rem 0', color: '#f59e0b', textAlign: 'center' }}>
              💰 Купить токен GROK
            </h3>
            
            <div style={{ color: '#e2e8f0', marginBottom: '1.5rem' }}>
              <p style={{ margin: '0.5rem 0' }}>
                <strong>Адрес контракта:</strong>
              </p>
              <code style={{
                display: 'block',
                background: '#0f172a',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                wordBreak: 'break-all',
                color: '#4ade80'
              }}>
                {TOKEN_ADDRESS}
              </code>
              
              <p style={{ margin: '1rem 0 0.5rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                {isTestnet ? '🧪 Тестовая сеть (BSC Testnet)' : '🌐 Основная сеть (BSC Mainnet)'}
              </p>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <button
                onClick={handleBuy}
                style={{
                  padding: '1rem',
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                🥞 Открыть PancakeSwap
              </button>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(TOKEN_ADDRESS);
                  alert('✅ Адрес скопирован!');
                }}
                style={{
                  padding: '0.75rem',
                  background: '#334155',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                📋 Скопировать адрес контракта
              </button>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                marginTop: '1rem',
                width: '100%',
                padding: '0.5rem',
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid #475569',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}