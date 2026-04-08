import { useLanguage } from '../contexts/LanguageContext';

const TIMERS = [
  { label: '⚡ 5 мин', seconds: 300 },
  { label: '🕐 15 мин', seconds: 900 },
  { label: '🕑 1 час', seconds: 3600 },
  { label: '🌙 6 часов', seconds: 21600 },
  { label: '🌞 24 часа', seconds: 86400 }
];

export default function TimerSelector({ selected, onChange }) {
  const { t } = useLanguage();
  
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
      <h4 style={{ margin: '0 0 0.5rem' }}>{t('timerSelect') || '⏱️ Время на партию'}</h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {TIMERS.map((timer, idx) => (
          <button
            key={idx}
            onClick={() => onChange(idx)}
            style={{
              padding: '0.5rem 0.8rem',
              background: selected === idx ? '#3b82f6' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: selected === idx ? 'bold' : 'normal',
              transition: 'all 0.2s'
            }}
          >
            {timer.label}
          </button>
        ))}
      </div>
    </div>
  );
}