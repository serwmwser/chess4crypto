import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import WalletConnect from './components/WalletConnect';
import Profile from './pages/Profile';

// Заглушка главной страницы (замените на ваш ChessBoard/Home)
function Home() {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
      <h2 style={{ color: '#f59e0b', marginBottom: '1rem' }}>♟️ Chess4Crypto</h2>
      <p>Главная страница с шахматной доской и матчмейкингом</p>
      <p style={{ marginTop: '1rem', fontSize: '0.85rem' }}>👉 Перейдите в <Link to="/profile" style={{ color: '#3b82f6' }}>Профиль</Link> для ставок в GROK</p>
    </div>
  );
}

function Navbar() {
  const location = useLocation();
  const links = [
    { path: '/', label: '🏠 Главная' },
    { path: '/profile', label: '👤 Профиль' }
  ];

  return (
    <nav style={styles.nav}>
      <div style={styles.navBrand}>♟️ Chess4Crypto</div>
      <div style={styles.navLinks}>
        {links.map(link => (
          <Link 
            key={link.path} 
            to={link.path}
            style={{
              ...styles.navLink,
              background: location.pathname === link.path ? '#3b82f6' : 'transparent',
              color: location.pathname === link.path ? '#fff' : '#94a3b8'
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div style={styles.navWallet}>
        <WalletConnect />
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div style={styles.app}>
        <Navbar />
        <main style={styles.main}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            {/* Добавьте другие маршруты по мере необходимости */}
          </Routes>
        </main>
        <footer style={styles.footer}>
          © 2026 Chess4Crypto | Web3 Chess & GROK Betting
        </footer>
      </div>
    </Router>
  );
}

// 🎨 Стили
const styles = {
  app: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0b1120', color: '#e2e8f0' },
  main: { flex: 1 },
  
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1.5rem', background: '#0f172a', borderBottom: '1px solid #1e293b' },
  navBrand: { color: '#f59e0b', fontWeight: 'bold', fontSize: '1.1rem' },
  navLinks: { display: 'flex', gap: '0.5rem' },
  navLink: { padding: '0.5rem 0.8rem', borderRadius: '8px', textDecoration: 'none', fontSize: '0.9rem', transition: '0.2s' },
  navWallet: { marginLeft: '1rem' },
  
  footer: { textAlign: 'center', padding: '1.5rem', color: '#475569', fontSize: '0.8rem', borderTop: '1px solid #1e293b' }
};