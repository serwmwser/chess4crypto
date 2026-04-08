import { useState } from 'react';

export default function Navbar({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'home', label: '🏠 Главная' },
    { id: 'play', label: '♟️ Играть' },
    { id: 'chat', label: '💬 Чат' },
    { id: 'settings', label: '⚙️ Настройки' }
  ];

  return (
    <nav style={{ 
      background: '#1e293b', 
      padding: '0.5rem', 
      display: 'flex', 
      justifyContent: 'center', 
      gap: '0.5rem', 
      flexWrap: 'wrap', 
      borderBottom: '1px solid #334155' 
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            padding: '0.5rem 1rem',
            background: activeTab === tab.id ? '#f59e0b' : 'transparent',
            color: activeTab === tab.id ? '#000' : '#e2e8f0',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: activeTab === tab.id ? 'bold' : 'normal',
            transition: 'all 0.2s'
          }}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}