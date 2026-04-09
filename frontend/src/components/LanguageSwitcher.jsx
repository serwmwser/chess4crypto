import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const btnStyle = (active) => ({
    padding: '4px 8px', fontSize: '0.8rem', fontWeight: active ? 'bold' : 'normal',
    background: active ? '#3b82f6' : 'transparent', border: '1px solid #334155',
    borderRadius: '4px', color: '#fff', cursor: 'pointer'
  });

  return (
    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
      <button onClick={() => i18n.changeLanguage('en')} style={btnStyle(i18n.language === 'en')}>EN</button>
      <button onClick={() => i18n.changeLanguage('ru')} style={btnStyle(i18n.language === 'ru')}>RU</button>
    </div>
  );
}