import { useTranslation } from 'react-i18next';
import WalletConnect from './WalletConnect';
import LanguageSwitcher from './LanguageSwitcher';
import BuyTokenButton from './BuyTokenButton';

export default function Navbar({ activeTab, onTabChange, isGuest, isConnected, onGuestLogout }) {
  const { t } = useTranslation();

  const tabs = [
    { id: 'home', label: t('tabs.home') },
    { id: 'play', label: t('tabs.play') },
    { id: 'chat', label: t('tabs.chat') },
    ...(isConnected ? [{ id: 'profile', label: t('tabs.profile') }] : [])
  ];

  return (
    <nav style={styles.nav}>
      {/* 🧭 Вкладки навигации */}
      <div style={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              ...styles.tabBtn,
              ...(activeTab === tab.id ? styles.tabBtnActive : {})
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 🔧 Панель управления */}
      <div style={styles.controls}>
        <LanguageSwitcher />
        
        {isGuest && !isConnected && (
          <span style={styles.badge}>{t('header.guest')}</span>
        )}
        
        <WalletConnect />
        
        {isGuest && isConnected && (
          <button onClick={onGuestLogout} style={styles.guestExitBtn}>
            {t('header.disconnect')}
          </button>
        )}

        <BuyTokenButton isGuest={isGuest} />
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    padding: '0.6rem 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.75rem',
    borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    backdropFilter: 'blur(10px)'
  },
  tabs: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' },
  tabBtn: {
    padding: '0.5rem 1.1rem',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#94a3b8',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.88rem',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    letterSpacing: '0.3px'
  },
  tabBtnActive: {
    background: 'linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)',
    color: '#fff',
    border: 'none',
    boxShadow: '0 0 18px rgba(99, 102, 241, 0.45)',
    transform: 'translateY(-1px)'
  },
  controls: { display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' },
  badge: {
    background: 'rgba(245, 158, 11, 0.12)',
    color: '#fbbf24',
    padding: '0.3rem 0.7rem',
    borderRadius: '12px',
    fontSize: '0.78rem',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    fontWeight: '600',
    letterSpacing: '0.5px'
  },
  guestExitBtn: {
    padding: '0.4rem 0.75rem',
    background: 'rgba(239, 68, 68, 0.12)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '600',
    transition: 'all 0.2s'
  }
};