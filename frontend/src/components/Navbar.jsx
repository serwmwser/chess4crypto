import BuyTokenButton from './BuyTokenButton';

export default function Navbar({ activeTab, onTabChange, isGuest, isConnected }) {
  const tabs = [
    { id: 'home', label: '🏠 Главная' },
    { id: 'play', label: '♟️ Играть' },
    { id: 'chat', label: '💬 Чат' },
    ...(isConnected ? [{ id: 'profile', label: '👤 Профиль' }] : [])
  ];

  return (
    <nav style={styles.nav}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onTabChange(tab.id)} style={getTabStyle(activeTab === tab.id)}>
          {tab.label}
        </button>
      ))}
      <div style={styles.buyButtonWrapper}>
        <BuyTokenButton isGuest={isGuest} />
      </div>
    </nav>
  );
}

const styles = {
  nav: { background: '#1e293b', padding: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid #334155' },
  buyButtonWrapper: { marginLeft: 'auto' }
};

const getTabStyle = (isActive) => ({
  padding: '0.5rem 1rem', background: isActive ? '#f59e0b' : 'transparent', color: isActive ? '#000' : '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: isActive ? 'bold' : 'normal', transition: 'all 0.2s'
});